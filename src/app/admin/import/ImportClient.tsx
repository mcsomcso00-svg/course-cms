"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { PreviewRow, RowStatus, SectionMeta } from "@/lib/bulk/types";
import {
  previewImport,
  commitImport,
  type PreviewResult,
  type CommitResult,
} from "./actions";

const BADGE: Record<RowStatus, { label: string; cls: string }> = {
  new: { label: "新增", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  update: { label: "更新", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  error: { label: "錯誤", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

export default function ImportClient({ meta }: { meta: SectionMeta }) {
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [done, setDone] = useState<CommitResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [previewing, startPreview] = useTransition();
  const [committing, startCommit] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setPreview(null);
    setDone(null);
    setErr(null);
  }

  function onPreview(e: React.FormEvent) {
    e.preventDefault();
    reset();
    const f = fileRef.current?.files?.[0];
    if (!f) {
      setErr("請先選擇檔案。");
      return;
    }
    const fd = new FormData();
    fd.set("file", f);
    startPreview(async () => {
      const r = await previewImport(meta.key, fd);
      if (!r.ok) setErr(r.error ?? "預覽失敗。");
      else setPreview(r);
    });
  }

  function onCommit() {
    if (!preview?.rows) return;
    const valid = preview.rows.filter((r) => r.status !== "error");
    if (valid.length === 0) return;
    setErr(null);
    startCommit(async () => {
      // 連同錯誤列一併傳回：伺服器只寫入有效列，並回報略過數
      const r = await commitImport(meta.key, preview.rows!);
      if (!r.ok) setErr(r.error ?? "匯入失敗。");
      else {
        setDone(r);
        setPreview(null);
        setFileName("");
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  }

  const sum = preview?.summary;
  const validCount = sum ? sum.create + sum.update : 0;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-1 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/admin/import" className="hover:text-gray-700">
          批量匯入
        </Link>
        <span>/</span>
        <span className="text-gray-600">{meta.title}</span>
      </div>
      <h1 className="text-xl font-bold tracking-tight">匯入{meta.title}</h1>
      <p className="mt-1 text-sm text-gray-500">{meta.description}</p>

      {/* 步驟一：下載範本 + 上載 */}
      <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/admin/import/${meta.key}/template`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-100"
          >
            ⬇ 下載 Excel 範本
          </a>
          <span className="text-xs text-gray-400">
            含「{meta.title}」欄位與「說明」頁；填好資料後上載。
          </span>
        </div>

        <form onSubmit={onPreview} className="mt-4 flex flex-wrap items-center gap-3">
          <label className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 cursor-pointer">
            選擇檔案
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            />
          </label>
          <span className="max-w-[16rem] truncate text-sm text-gray-500">
            {fileName || "未選擇檔案"}
          </span>
          <button
            type="submit"
            disabled={previewing}
            className="rounded-lg bg-black px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {previewing ? "讀取中…" : "預覽"}
          </button>
        </form>
      </div>

      {err && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {err}
        </div>
      )}

      {done && done.ok && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          匯入完成：新增 {done.created} 筆、更新 {done.updated} 筆
          {done.skipped ? `、略過 ${done.skipped} 筆（有錯誤）` : ""}。
        </div>
      )}

      {/* 步驟二：預覽 */}
      {preview?.ok && sum && (
        <div className="mt-5">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
                共 {sum.total} 列
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                新增 {sum.create}
              </span>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700">
                更新 {sum.update}
              </span>
              <span
                className={
                  "rounded-full border px-3 py-1 " +
                  (sum.error
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-gray-200 bg-white text-gray-400")
                }
              >
                錯誤 {sum.error}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {sum.error > 0 && (
                <span className="text-xs text-gray-400">
                  錯誤列會被略過，只匯入新增 / 更新列
                </span>
              )}
              <button
                type="button"
                onClick={onCommit}
                disabled={committing || validCount === 0}
                className="rounded-lg bg-black px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {committing
                  ? "匯入中…"
                  : `確認匯入 ${validCount} 筆`}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 text-left text-xs text-gray-500">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2 font-medium">列</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium">狀態</th>
                  {meta.columns.map((c) => (
                    <th
                      key={c.key}
                      className="whitespace-nowrap px-3 py-2 font-medium"
                    >
                      {c.header}
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-3 py-2 font-medium">訊息</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows!.map((r: PreviewRow) => {
                  const b = BADGE[r.status];
                  return (
                    <tr
                      key={r.rowNo}
                      className={
                        "border-b border-gray-100 last:border-b-0 " +
                        (r.status === "error" ? "bg-rose-50/40" : "")
                      }
                    >
                      <td className="px-3 py-2 text-gray-400">{r.rowNo}</td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            "whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] " +
                            b.cls
                          }
                        >
                          {b.label}
                        </span>
                      </td>
                      {meta.columns.map((c) => (
                        <td
                          key={c.key}
                          className="max-w-[14rem] truncate px-3 py-2"
                          title={r.display[c.key] ?? ""}
                        >
                          {r.display[c.key] || (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-xs text-rose-600">
                        {r.messages.join("；")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
