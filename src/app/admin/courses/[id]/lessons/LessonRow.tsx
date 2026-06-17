"use client";

import { useState } from "react";
import { updateLesson, setLessonStatus } from "./actions";

export type LessonRowData = {
  id: string;
  dateStr: string;
  groupName: string;
  startTime: string;
  endTime: string;
  status: string;
  coursePrepStatus: string;
  materialStatus: string;
  tutorPrepStatus: string;
  tutorId: string | null;
  substituteTutorId: string | null;
  tutorName: string | null;
  substituteName: string | null;
  tutorFee: string;
  notes: string;
  checkInTime: string;
  checkOutTime: string;
  disabled: boolean;
};

const PREP: Record<string, { label: string; cls: string }> = {
  NONE: { label: "未有內容", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  IN_PROGRESS: { label: "準備中", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  DONE: { label: "已完成", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};
const TPREP: Record<string, { label: string; cls: string }> = {
  NOT_SENT: { label: "未發送", cls: "bg-gray-100 text-gray-500 border-gray-200" },
  SENT: { label: "已發送", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  CONFIRMED: { label: "已確認", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const fld =
  "rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

function Pill({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={"rounded-full border px-2 py-0.5 text-[11px] " + cls}>
      {label}
    </span>
  );
}

export default function LessonRow({
  row,
  tutors,
  courseId,
}: {
  row: LessonRowData;
  tutors: { id: string; name: string }[];
  courseId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        className={
          "border-b border-gray-100 last:border-b-0 " +
          (row.disabled ? "bg-gray-50 text-gray-400" : "")
        }
      >
        <td className="whitespace-nowrap px-4 py-2.5 align-top">
          {row.dateStr}
          {row.disabled && <span className="ml-1 text-[11px]">（已停用）</span>}
        </td>
        <td className="px-4 py-2.5 align-top">{row.groupName}</td>
        <td className="whitespace-nowrap px-4 py-2.5 align-top">
          {row.startTime}-{row.endTime}
        </td>
        <td className="px-4 py-2.5 align-top">
          <Pill {...PREP[row.coursePrepStatus]} />
        </td>
        <td className="px-4 py-2.5 align-top">
          <Pill {...TPREP[row.tutorPrepStatus]} />
        </td>
        <td className="whitespace-nowrap px-4 py-2.5 align-top">
          <div>
            {row.tutorName ?? <span className="text-gray-400">（空缺）</span>}
            {row.substituteName && (
              <span className="ml-1 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">
                代 {row.substituteName}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[11px] text-gray-400">
            <div>上堂時間：{row.checkInTime}</div>
            <div>落堂時間：{row.checkOutTime}</div>
          </div>
        </td>
        <td className="px-4 py-2.5 align-top">
          {row.tutorFee ? `$${row.tutorFee}` : "0"}
        </td>
        <td className="max-w-[12rem] truncate px-4 py-2.5 align-top">
          {row.notes || "—"}
        </td>
        <td className="whitespace-nowrap px-4 py-2.5 align-top">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
            >
              {open ? "收起" : "編輯"}
            </button>
            <form
              action={setLessonStatus.bind(
                null,
                row.id,
                courseId,
                row.disabled ? "SCHEDULED" : "DISABLED"
              )}
            >
              <button
                type="submit"
                className="rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
              >
                {row.disabled ? "啟用" : "停用"}
              </button>
            </form>
          </div>
        </td>
      </tr>

      {open && (
        <tr className="border-b border-gray-100 bg-gray-50/60">
          <td colSpan={9} className="px-4 py-4">
            <form
              action={updateLesson.bind(null, row.id, courseId)}
              className="flex flex-wrap items-end gap-4"
            >
              {/* 保留不在此處編輯的欄位 */}
              <input type="hidden" name="date" value={row.dateStr} />
              <input type="hidden" name="status" value={row.status} />
              <input type="hidden" name="materialStatus" value={row.materialStatus} />
              <input
                type="hidden"
                name="substituteTutorId"
                value={row.substituteTutorId ?? ""}
              />

              <Field label="開始">
                <input type="time" name="startTime" defaultValue={row.startTime} className={fld} />
              </Field>
              <Field label="結束">
                <input type="time" name="endTime" defaultValue={row.endTime} className={fld} />
              </Field>
              <Field label="課程準備">
                <select name="coursePrepStatus" defaultValue={row.coursePrepStatus} className={fld}>
                  <option value="NONE">未有內容</option>
                  <option value="IN_PROGRESS">準備中</option>
                  <option value="DONE">已完成</option>
                </select>
              </Field>
              <Field label="導師備課">
                <select name="tutorPrepStatus" defaultValue={row.tutorPrepStatus} className={fld}>
                  <option value="NOT_SENT">未發送</option>
                  <option value="SENT">已發送</option>
                  <option value="CONFIRMED">已確認</option>
                </select>
              </Field>
              <Field label="導師">
                <select name="tutorId" defaultValue={row.tutorId ?? ""} className={fld}>
                  <option value="">空缺</option>
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="上堂時間">
                <input type="time" name="checkInTime" defaultValue={row.checkInTime} className={fld} />
              </Field>
              <Field label="落堂時間">
                <input type="time" name="checkOutTime" defaultValue={row.checkOutTime} className={fld} />
              </Field>
              <Field label="導師費">
                <input type="number" name="tutorFee" min={0} step="0.01" defaultValue={row.tutorFee} className={fld + " w-24"} />
              </Field>
              <Field label="備註">
                <input name="notes" defaultValue={row.notes} className={fld + " w-48"} />
              </Field>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
                >
                  取消
                </button>
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-500">{label}</label>
      {children}
    </div>
  );
}
