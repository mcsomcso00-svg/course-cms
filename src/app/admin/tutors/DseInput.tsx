"use client";

import { useState } from "react";

type Row = { subject: string; grade: string };

function parse(s?: string | null): Row[] {
  if (!s) return [];
  try {
    const o = JSON.parse(s);
    if (o && typeof o === "object" && !Array.isArray(o)) {
      return Object.entries(o).map(([subject, grade]) => ({
        subject,
        grade: String(grade ?? ""),
      }));
    }
  } catch {
    // 舊有純文字 DSE：放入「其他」
    return [{ subject: "其他", grade: s }];
  }
  return [];
}

const inputCls =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

export default function DseInput({
  defaultValue,
}: {
  defaultValue?: string | null;
}) {
  const init = parse(defaultValue);
  const [rows, setRows] = useState<Row[]>(
    init.length
      ? init
      : [
          { subject: "中文", grade: "" },
          { subject: "英文", grade: "" },
          { subject: "數學", grade: "" },
        ]
  );

  const json = JSON.stringify(
    Object.fromEntries(
      rows
        .filter((r) => r.subject.trim())
        .map((r) => [r.subject.trim(), r.grade.trim()])
    )
  );

  function update(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function remove(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="col-span-2">
      <label className="mb-1 block text-sm font-medium">DSE 成績</label>
      <input type="hidden" name="dseResult" value={json} />
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={r.subject}
              onChange={(e) => update(i, { subject: e.target.value })}
              placeholder="科目"
              className={inputCls + " w-28"}
            />
            <input
              value={r.grade}
              onChange={(e) => update(i, { grade: e.target.value })}
              placeholder="成績"
              className={inputCls + " w-24"}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-xs text-rose-500 hover:underline"
            >
              移除
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRows((p) => [...p, { subject: "", grade: "" }])}
        className="mt-2 rounded-lg border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100"
      >
        + 新增科目
      </button>
    </div>
  );
}
