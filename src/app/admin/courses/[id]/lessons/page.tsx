import Link from "next/link";
import { notFound } from "next/navigation";
import type { LessonStatus, PrepStatus, TutorPrepStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import ConfirmButton from "@/components/ConfirmButton";
import CourseHeader from "../CourseHeader";
import { generateLessons } from "./actions";
import LessonRow, { type LessonRowData } from "./LessonRow";

const LSTATUS: Record<LessonStatus, string> = {
  SCHEDULED: "已編排",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  RESCHEDULED: "已改期",
  DISABLED: "已停用",
};

const selCls =
  "rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

export default async function LessonsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    month?: string;
    prep?: string;
    review?: string;
    tutor?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) notFound();

  const [groups, tutors] = await Promise.all([
    prisma.group.findMany({ where: { courseId: id }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: "TUTOR", isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const month = sp.month?.trim() || undefined;
  let monthFilter = {};
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    monthFilter = {
      date: { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) },
    };
  }

  const lessons = await prisma.lesson.findMany({
    where: {
      group: { courseId: id },
      ...monthFilter,
      ...(sp.prep ? { coursePrepStatus: sp.prep as PrepStatus } : {}),
      ...(sp.review ? { tutorPrepStatus: sp.review as TutorPrepStatus } : {}),
      ...(sp.tutor
        ? sp.tutor === "__none__"
          ? { tutorId: null }
          : { tutorId: sp.tutor }
        : {}),
    },
    include: {
      group: true,
      tutor: true,
      substitute: true,
      checkIns: {
        select: { checkInAt: true, checkOutAt: true, tutorId: true },
      },
    },
    orderBy: [{ date: "asc" }, { startAt: "asc" }],
  });

  const hm = (d: Date) =>
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Hong_Kong",
    });

  const rows: LessonRowData[] = lessons.map((l) => {
    const effId = l.substituteTutorId ?? l.tutorId;
    const ci = l.checkIns.find((c) => c.tutorId === effId) ?? l.checkIns[0];
    return {
      id: l.id,
      dateStr: l.date.toISOString().slice(0, 10),
      groupName: l.group.name,
      startTime: hm(l.startAt),
      endTime: hm(l.endAt),
      status: l.status,
      coursePrepStatus: l.coursePrepStatus,
      materialStatus: l.materialStatus,
      tutorPrepStatus: l.tutorPrepStatus,
      tutorId: l.tutorId,
      substituteTutorId: l.substituteTutorId,
      tutorName: l.tutor?.name ?? null,
      substituteName: l.substitute?.name ?? null,
      tutorFee: l.tutorFee != null ? String(Number(l.tutorFee)) : "",
      notes: l.notes ?? "",
      checkInTime: ci?.checkInAt ? hm(ci.checkInAt) : "",
      checkOutTime: ci?.checkOutAt ? hm(ci.checkOutAt) : "",
      disabled: l.status === "DISABLED",
    };
  });
  const tutorOpts = tutors.map((t) => ({ id: t.id, name: t.name }));

  return (
    <div className="mx-auto max-w-6xl p-6">
      <CourseHeader course={course} active="lessons" />

      {/* 工具列：篩選 + 操作 */}
      <form
        action={`/admin/courses/${id}/lessons`}
        className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-3"
      >
        <div>
          <label className="mb-1 block text-xs text-gray-500">月份</label>
          <input type="month" name="month" defaultValue={month ?? ""} className={selCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">課程準備</label>
          <select name="prep" defaultValue={sp.prep ?? ""} className={selCls}>
            <option value="">全部</option>
            <option value="NONE">未有內容</option>
            <option value="IN_PROGRESS">準備中</option>
            <option value="DONE">已完成</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">導師備課</label>
          <select name="review" defaultValue={sp.review ?? ""} className={selCls}>
            <option value="">全部</option>
            <option value="NOT_SENT">未發送</option>
            <option value="SENT">已發送</option>
            <option value="CONFIRMED">已確認</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">導師</label>
          <select name="tutor" defaultValue={sp.tutor ?? ""} className={selCls}>
            <option value="">全部</option>
            <option value="__none__">空缺</option>
            {tutors.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          整理
        </button>
        {(month || sp.prep || sp.review || sp.tutor) && (
          <Link
            href={`/admin/courses/${id}/lessons`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            清除
          </Link>
        )}
        <div className="flex-1" />
        <Link
          href={`/admin/courses/${id}/lessons/new`}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
        >
          + 新增課堂
        </Link>
        <ConfirmButton
          action={generateLessons.bind(null, id)}
          message="按小組時間表，於課程開始～結束日期之間批量產生課堂（已存在的日期會略過）。確定？"
          className="rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          批量產生課堂
        </ConfirmButton>
      </form>

      {/* 課堂列表 */}
      {lessons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          未有課堂。可按「批量產生課堂」依小組時間表產生，或「+ 新增課堂」手動加入。
          {groups.length === 0 && (
            <span className="mt-1 block text-gray-400">
              （此課程尚未建立小組，請先到「課程基本信息」新增小組）
            </span>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">日期</th>
                <th className="px-4 py-2.5 font-medium">小組</th>
                <th className="px-4 py-2.5 font-medium">課程時間</th>
                <th className="px-4 py-2.5 font-medium">課程準備</th>
                <th className="px-4 py-2.5 font-medium">導師備課</th>
                <th className="px-4 py-2.5 font-medium">導師</th>
                <th className="px-4 py-2.5 font-medium">導師費</th>
                <th className="px-4 py-2.5 font-medium">備註</th>
                <th className="px-4 py-2.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <LessonRow
                  key={row.id}
                  row={row}
                  tutors={tutorOpts}
                  courseId={id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">
        狀態：
        {Object.values(LSTATUS).join(" · ")}
      </p>
    </div>
  );
}
