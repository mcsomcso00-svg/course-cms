"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getSpec } from "@/lib/bulk/specs";
import { parseUpload } from "@/lib/bulk/excel";
import type { PreviewRow } from "@/lib/bulk/types";

export interface PreviewResult {
  ok: boolean;
  error?: string;
  rows?: PreviewRow[];
  summary?: { total: number; create: number; update: number; error: number };
}

const MAX_ROWS = 1000;

function summarize(rows: PreviewRow[]) {
  return {
    total: rows.length,
    create: rows.filter((r) => r.status === "new").length,
    update: rows.filter((r) => r.status === "update").length,
    error: rows.filter((r) => r.status === "error").length,
  };
}

// 批次內以 dupKey 去重：同鍵的後續列標為錯誤
function dedup(rows: PreviewRow[]) {
  const seen = new Map<string, number>();
  for (const r of rows) {
    if (r.status === "error" || !r.dupKey) continue;
    const first = seen.get(r.dupKey);
    if (first != null) {
      r.status = "error";
      r.data = null;
      r.messages.push(`與第 ${first} 列重複`);
    } else {
      seen.set(r.dupKey, r.rowNo);
    }
  }
}

export async function previewImport(
  section: string,
  formData: FormData
): Promise<PreviewResult> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return { ok: false, error: "未授權。" };

  const spec = getSpec(section);
  if (!spec) return { ok: false, error: "未知的匯入區段。" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "請先選擇檔案。" };
  if (file.size > 5_000_000)
    return { ok: false, error: "檔案過大（上限 5MB）。" };

  const buf = Buffer.from(await file.arrayBuffer());
  const { rows: raws, error } = await parseUpload(spec, buf);
  if (error) return { ok: false, error };
  if (raws.length === 0)
    return { ok: false, error: "檔案沒有任何資料列。" };
  if (raws.length > MAX_ROWS)
    return { ok: false, error: `一次最多匯入 ${MAX_ROWS} 列（目前 ${raws.length} 列）。` };

  const ctx = await spec.loadContext();
  const rows = raws.map((raw, i) => spec.buildRow(raw, i + 2, ctx));
  dedup(rows);

  return { ok: true, rows, summary: summarize(rows) };
}

export interface CommitResult {
  ok: boolean;
  error?: string;
  created?: number;
  updated?: number;
  skipped?: number;
}

export async function commitImport(
  section: string,
  rows: PreviewRow[]
): Promise<CommitResult> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return { ok: false, error: "未授權。" };

  const spec = getSpec(section);
  if (!spec) return { ok: false, error: "未知的匯入區段。" };
  if (!Array.isArray(rows) || rows.length === 0)
    return { ok: false, error: "沒有可匯入的資料。" };

  const skipped = rows.filter((r) => r.status === "error").length;
  try {
    const { created, updated, revalidate } = await spec.commit(rows);
    for (const p of revalidate) revalidatePath(p);
    return { ok: true, created, updated, skipped };
  } catch (e) {
    return {
      ok: false,
      error: `匯入時發生錯誤：${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
