import Link from "next/link";
import type { Group, Lesson, User } from "@prisma/client";

const fieldCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

function hkTime(d: Date) {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Hong_Kong",
  });
}

export default function LessonForm({
  action,
  lesson,
  groupName,
  groups,
  tutors,
  title,
  backHref,
  checkInTime,
  checkOutTime,
}: {
  action: (formData: FormData) => void;
  lesson?: Lesson;
  groupName?: string;
  groups?: Group[];
  tutors: User[];
  title: string;
  backHref: string;
  checkInTime?: string;
  checkOutTime?: string;
}) {
  const isEdit = !!lesson;

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
        {/* 小組 */}
        <div>
          <label className="mb-1 block text-sm font-medium">小組</label>
          {isEdit ? (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {groupName}
            </p>
          ) : (
            <select name="groupId" required className={fieldCls} defaultValue="">
              <option value="" disabled>
                請選擇小組
              </option>
              {groups?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              日期 <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              required
              defaultValue={lesson ? lesson.date.toISOString().slice(0, 10) : ""}
              className={fieldCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">開始</label>
            <input
              type="time"
              name="startTime"
              defaultValue={lesson ? hkTime(lesson.startAt) : ""}
              className={fieldCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">結束</label>
            <input
              type="time"
              name="endTime"
              defaultValue={lesson ? hkTime(lesson.endAt) : ""}
              className={fieldCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">課程準備</label>
            <select
              name="coursePrepStatus"
              defaultValue={lesson?.coursePrepStatus ?? "NONE"}
              className={fieldCls}
            >
              <option value="NONE">未有內容</option>
              <option value="IN_PROGRESS">準備中</option>
              <option value="DONE">已完成</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">導師備課</label>
            <select
              name="tutorPrepStatus"
              defaultValue={lesson?.tutorPrepStatus ?? "NOT_SENT"}
              className={fieldCls}
            >
              <option value="NOT_SENT">未發送</option>
              <option value="SENT">已發送</option>
              <option value="CONFIRMED">已確認</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">物資狀態</label>
          <select
            name="materialStatus"
            defaultValue={lesson?.materialStatus ?? "NO_CONTENT"}
            className={fieldCls}
          >
            <option value="NO_CONTENT">未有內容</option>
            <option value="NO_MATERIAL">未有物資</option>
            <option value="NOT_SENT_SCHOOL">未送出學校</option>
            <option value="DONE">已完成</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">導師</label>
            <select
              name="tutorId"
              defaultValue={lesson?.tutorId ?? ""}
              className={fieldCls}
            >
              <option value="">空缺</option>
              {tutors.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">代課導師</label>
            <select
              name="substituteTutorId"
              defaultValue={lesson?.substituteTutorId ?? ""}
              className={fieldCls}
            >
              <option value="">無</option>
              {tutors.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isEdit && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="mb-2 text-sm font-medium">導師打卡時間（可手動修改）</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-gray-500">上堂時間</label>
                <input
                  type="time"
                  name="checkInTime"
                  defaultValue={checkInTime ?? ""}
                  className={fieldCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-500">落堂時間</label>
                <input
                  type="time"
                  name="checkOutTime"
                  defaultValue={checkOutTime ?? ""}
                  className={fieldCls}
                />
              </div>
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              需已指派導師方可記錄；設定上堂時間會按薪金規則重新計算堂費。
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">導師費 (HKD)</label>
            <input
              type="number"
              name="tutorFee"
              min={0}
              step="0.01"
              defaultValue={lesson?.tutorFee ? Number(lesson.tutorFee) : ""}
              className={fieldCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">狀態</label>
            <select
              name="status"
              defaultValue={lesson?.status ?? "SCHEDULED"}
              className={fieldCls}
            >
              <option value="SCHEDULED">已編排</option>
              <option value="COMPLETED">已完成</option>
              <option value="CANCELLED">已取消</option>
              <option value="RESCHEDULED">已改期</option>
              <option value="DISABLED">已停用</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">備註</label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={lesson?.notes ?? ""}
            className={fieldCls}
          />
        </div>

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
