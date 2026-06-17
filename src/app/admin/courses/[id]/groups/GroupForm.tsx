import Link from "next/link";
import type { Group } from "@prisma/client";

const fieldCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

const GRADES = [
  "學前班",
  "幼兒班",
  "低班",
  "高班",
  "幼稚園 K1",
  "幼稚園 K2",
  "幼稚園 K3",
  "小學一年級",
  "小學二年級",
  "小學三年級",
  "小學四年級",
  "小學五年級",
  "小學六年級",
  "中學一年級",
  "中學二年級",
  "中學三年級",
  "中學四年級",
  "中學五年級",
  "中學六年級",
];

const DAYS = [
  { v: "1", label: "星期一" },
  { v: "2", label: "星期二" },
  { v: "3", label: "星期三" },
  { v: "4", label: "星期四" },
  { v: "5", label: "星期五" },
  { v: "6", label: "星期六" },
  { v: "7", label: "星期日" },
];

export default function GroupForm({
  action,
  group,
  courseName,
  backHref,
  title,
}: {
  action: (formData: FormData) => void;
  group?: Group;
  courseName: string;
  backHref: string;
  title: string;
}) {
  const grades = group?.studentGrades ?? [];

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <Link href={backHref} className="text-sm text-gray-500 hover:underline">
          ← 返回
        </Link>
      </div>

      <form
        action={action}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-6"
      >
        <p className="text-sm text-gray-500">
          課程：<span className="font-medium text-gray-900">{courseName}</span>
        </p>

        <div>
          <label className="mb-1 block text-sm font-medium">
            小組名稱 <span className="text-rose-500">*</span>
          </label>
          <input
            name="name"
            required
            defaultValue={group?.name ?? ""}
            placeholder="例如 A組"
            className={fieldCls}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">學生年級</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {GRADES.map((g) => (
              <label
                key={g}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
              >
                <input
                  type="checkbox"
                  name="studentGrades"
                  value={g}
                  defaultChecked={grades.includes(g)}
                  className="accent-black"
                />
                {g}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">學生人數</label>
          <input
            type="number"
            name="studentCount"
            min={0}
            defaultValue={group?.studentCount ?? ""}
            className={fieldCls}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">上課星期（可多選）</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DAYS.map((d) => (
              <label
                key={d.v}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
              >
                <input
                  type="checkbox"
                  name="daysOfWeek"
                  value={d.v}
                  defaultChecked={(group?.daysOfWeek ?? []).includes(Number(d.v))}
                  className="accent-black"
                />
                {d.label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">開始時間</label>
            <input
              type="time"
              name="startTime"
              defaultValue={group?.startTime ?? ""}
              className={fieldCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">結束時間</label>
            <input
              type="time"
              name="endTime"
              defaultValue={group?.endTime ?? ""}
              className={fieldCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">預算</label>
            <input
              name="budget"
              defaultValue={group?.budget ?? ""}
              placeholder="例如 每日"
              className={fieldCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">上堂地點</label>
            <input
              name="classLocation"
              defaultValue={group?.classLocation ?? ""}
              className={fieldCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">物資擺放位置</label>
            <input
              name="materialLocation"
              defaultValue={group?.materialLocation ?? ""}
              className={fieldCls}
            />
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="requiresTA"
              defaultChecked={group?.requiresTA ?? false}
              className="accent-black"
            />
            要求助教
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="requiresAssistant"
              defaultChecked={group?.requiresAssistant ?? false}
              className="accent-black"
            />
            要求助理
          </label>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">備註</label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={group?.notes ?? ""}
            className={fieldCls}
          />
        </div>

        <p className="text-xs text-gray-400">
          上課日期 / 課堂會於「課堂詳情」分頁按此時間表批量產生。
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <Link
            href={backHref}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
          >
            取消
          </Link>
          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            儲存
          </button>
        </div>
      </form>
    </div>
  );
}
