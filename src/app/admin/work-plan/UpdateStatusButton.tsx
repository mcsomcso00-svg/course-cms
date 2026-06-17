"use client";

import { useState } from "react";
import { setMaterialStatusBatch } from "./actions";

type LessonOpt = { id: string; label: string };
type GroupOpt = { id: string; name: string; lessons: LessonOpt[] };

const fld =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

export default function UpdateStatusButton({
  courseId,
  month,
  groups,
}: {
  courseId: string;
  month: string;
  groups: GroupOpt[];
}) {
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const group = groups.find((g) => g.id === groupId);
  const lessons = group?.lessons ?? [];

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((prev) =>
      prev.size === lessons.length ? new Set() : new Set(lessons.map((l) => l.id))
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-black px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-800"
      >
        更新狀態
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            action={setMaterialStatusBatch.bind(null, courseId)}
            className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6"
          >
            <input type="hidden" name="month" value={month} />
            <h3 className="font-semibold">更新物資準備狀態</h3>

            <div>
              <label className="mb-1 block text-sm text-gray-500">選擇小組</label>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {groups.map((g) => (
                  <label key={g.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="group"
                      checked={groupId === g.id}
                      onChange={() => {
                        setGroupId(g.id);
                        setSelected(new Set());
                      }}
                      className="accent-black"
                    />
                    {g.name}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm text-gray-500">選擇日期</label>
                {lessons.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-xs text-gray-500 underline"
                  >
                    {selected.size === lessons.length ? "取消全選" : "全選"}
                  </button>
                )}
              </div>
              {lessons.length === 0 ? (
                <p className="text-sm text-gray-400">此小組尚無課堂</p>
              ) : (
                <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                  {lessons.map((l) => (
                    <label key={l.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="lessonIds"
                        value={l.id}
                        checked={selected.has(l.id)}
                        onChange={() => toggle(l.id)}
                        className="accent-black"
                      />
                      {l.label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-500">更改設定</label>
              <select name="materialStatus" defaultValue="" required className={fld}>
                <option value="" disabled>
                  — 選擇狀態 —
                </option>
                <option value="NO_CONTENT">未有內容</option>
                <option value="NO_MATERIAL">未有物資</option>
                <option value="NOT_SENT_SCHOOL">未送出學校</option>
                <option value="DONE">已完成</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-gray-400">已選 {selected.size} 堂</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={selected.size === 0}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                >
                  保存
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
