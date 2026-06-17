"use client";

import { useState } from "react";
import Link from "next/link";
import { batchUpdateLessons, createJobConfirmations } from "./actions";

type LessonOpt = { id: string; label: string };
type GroupOpt = { id: string; name: string; lessons: LessonOpt[] };
type TutorOpt = { id: string; name: string };

const OPERATIONS = [
  { v: "REPLACE_TUTOR", label: "更換導師" },
  { v: "REPLACE_SUBSTITUTE", label: "更換代課導師" },
  { v: "TUTOR_PREP", label: "導師備課" },
  { v: "CHANGE_FEE", label: "更改費用" },
];

const fieldCls =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-24 shrink-0 pt-1.5 text-sm text-gray-500">{children}</div>
  );
}

export default function BatchForm({
  courseId,
  groups,
  tutors,
}: {
  courseId: string;
  groups: GroupOpt[];
  tutors: TutorOpt[];
}) {
  const [operation, setOperation] = useState("REPLACE_TUTOR");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const group = groups.find((g) => g.id === groupId);
  const lessons = group?.lessons ?? [];
  const showVacant =
    operation === "REPLACE_TUTOR" ||
    operation === "REPLACE_SUBSTITUTE" ||
    operation === "CHANGE_FEE";
  // 只有更換導師 / 更換代課導師可製作工作確認書
  const isTutorOp =
    operation === "REPLACE_TUTOR" || operation === "REPLACE_SUBSTITUTE";

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
      prev.size === lessons.length
        ? new Set()
        : new Set(lessons.map((l) => l.id))
    );
  }

  return (
    <form
      action={batchUpdateLessons.bind(null, courseId)}
      className="space-y-5 rounded-xl border border-gray-200 bg-white p-6"
    >
      <input type="hidden" name="operation" value={operation} />

      {/* 選擇操作 */}
      <div className="flex gap-3">
        <Label>選擇操作</Label>
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          {OPERATIONS.map((o) => (
            <label key={o.v} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="op"
                checked={operation === o.v}
                onChange={() => setOperation(o.v)}
                className="accent-black"
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      {/* 選擇小組 */}
      <div className="flex gap-3">
        <Label>選擇小組</Label>
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          {groups.length === 0 && (
            <span className="text-sm text-gray-400">尚未建立小組</span>
          )}
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

      {/* 選擇日期 */}
      <div className="flex gap-3">
        <Label>選擇日期</Label>
        <div className="flex-1">
          {lessons.length === 0 ? (
            <p className="pt-1 text-sm text-gray-400">此小組尚無課堂</p>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleAll}
                className="mb-2 text-xs text-gray-500 underline"
              >
                {selected.size === lessons.length ? "取消全選" : "全選"}
              </button>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {lessons.map((l, i) => (
                  <label key={l.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="lessonIds"
                      value={l.id}
                      checked={selected.has(l.id)}
                      onChange={() => toggle(l.id)}
                      className="accent-black"
                    />
                    L{i + 1}: {l.label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 數值（依操作而定） */}
      <div className="flex gap-3">
        <Label>更改設定</Label>
        <div className="flex flex-wrap items-center gap-3">
          {operation === "REPLACE_TUTOR" && (
            <select name="tutorId" className={fieldCls} defaultValue="">
              <option value="">— 選擇導師 —</option>
              {tutors.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          {operation === "REPLACE_SUBSTITUTE" && (
            <select name="substituteTutorId" className={fieldCls} defaultValue="">
              <option value="">— 選擇代課導師 —</option>
              {tutors.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          {operation === "TUTOR_PREP" && (
            <select name="tutorPrepStatus" className={fieldCls} defaultValue="NOT_SENT">
              <option value="NOT_SENT">未發送</option>
              <option value="SENT">已發送</option>
              <option value="CONFIRMED">已確認</option>
            </select>
          )}
          {operation === "CHANGE_FEE" && (
            <input
              type="number"
              name="tutorFee"
              min={0}
              step="0.01"
              placeholder="導師費 (HKD)"
              className={fieldCls + " w-40"}
            />
          )}
          {showVacant && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" name="vacant" className="accent-black" />
              空缺 / 清除
            </label>
          )}
        </div>
      </div>

      {/* 工作確認書欄位（只在更換導師 / 代課導師時顯示） */}
      {isTutorOp && (
        <div className="flex flex-wrap items-start gap-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">JC 導師費</label>
            <input
              type="number"
              name="jcFee"
              min={0}
              step="0.01"
              className={fieldCls + " w-32"}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-500">JC 其他協議</label>
            <textarea
              name="jcAgreement"
              rows={2}
              className={fieldCls + " w-full"}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="text-xs text-gray-400">已選 {selected.size} 堂</span>
        <div className="flex gap-2">
          {isTutorOp && (
            <button
              type="submit"
              formAction={createJobConfirmations.bind(null, courseId)}
              disabled={selected.size === 0}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-40"
            >
              製作JC
            </button>
          )}
          <Link
            href={`/admin/courses/${courseId}/lessons`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
          >
            返回課堂
          </Link>
          <button
            type="submit"
            disabled={selected.size === 0}
            className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
          >
            保存
          </button>
        </div>
      </div>
    </form>
  );
}
