"use client";

import { useState } from "react";
import { createAcademicYear } from "./actions";

export default function AddYearButton() {
  const [open, setOpen] = useState(false);
  const [yr, setYr] = useState(String(new Date().getFullYear()));
  const n = parseInt(yr, 10);
  const preview = /^\d{4}$/.test(yr) ? `${n}-${n + 1}` : "—";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full px-3.5 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
      >
        + 新增年度
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            action={createAcademicYear}
            className="w-full max-w-sm rounded-2xl bg-white p-6"
          >
            <h3 className="text-sm font-medium text-gray-500">
              本年度以開始年份計算
            </h3>
            <label className="mb-1 mt-3 block text-sm font-medium">開始年份</label>
            <input
              name="startYear"
              inputMode="numeric"
              value={yr}
              onChange={(e) => setYr(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            <p className="mt-2 text-sm text-gray-500">
              新增年度為 <span className="font-medium text-black">{preview}</span>
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={!/^\d{4}$/.test(yr)}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
              >
                新增
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
