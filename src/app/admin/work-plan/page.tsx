import Link from "next/link";
import type { MaterialPrepStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import UpdateStatusButton from "./UpdateStatusButton";

const WD = ["日", "一", "二", "三", "四", "五", "六"];

const MAT: Record<MaterialPrepStatus, string> = {
  NO_CONTENT: "未有內容",
  NO_MATERIAL: "未有物資",
  NOT_SENT_SCHOOL: "未送出學校",
  DONE: "已完成",
};

export default async function WorkPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const todayMonth = new Date()
    .toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong" })
    .slice(0, 7);
  const month =
    sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : todayMonth;
  const [y, m] = month.split("-").map(Number);
  const gte = new Date(Date.UTC(y, m - 1, 1));
  const lt = new Date(Date.UTC(y, m, 1));

  // 該月份內仍有物資未準備（materialStatus ≠ 已完成）的課程
  const courses = await prisma.course.findMany({
    where: {
      groups: {
        some: {
          lessons: {
            some: { materialStatus: { not: "DONE" }, date: { gte, lt } },
          },
        },
      },
    },
    include: {
      school: true,
      groups: {
        orderBy: { name: "asc" },
        include: {
          lessons: {
            orderBy: { date: "asc" },
            select: { id: true, date: true, materialStatus: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const rows = courses.map((course) => {
    // 各小組課堂的 L 編號 + 供彈窗選擇的資料
    const modalGroups = course.groups.map((g) => ({
      id: g.id,
      name: g.name,
      lessons: g.lessons.map((l, i) => ({
        id: l.id,
        label: `L${i + 1}: ${l.date.toISOString().slice(0, 10)}(${WD[l.date.getUTCDay()]})`,
      })),
    }));

    // 該月份最早一堂未完成物資
    const outstanding = course.groups.flatMap((g) =>
      g.lessons
        .map((l, i) => ({ date: l.date, code: i + 1, status: l.materialStatus }))
        .filter(
          (x) =>
            x.status !== "DONE" &&
            x.date.getTime() >= gte.getTime() &&
            x.date.getTime() < lt.getTime()
        )
    );
    const e =
      outstanding.sort((a, b) => a.date.getTime() - b.date.getTime())[0] ?? null;

    return {
      courseId: course.id,
      schoolName: course.school.name,
      courseName: course.name,
      workPlanNote: course.workPlanNote,
      earliest: e,
      earliestMs: e ? e.date.getTime() : Infinity,
      modalGroups,
    };
  });
  rows.sort((a, b) => a.earliestMs - b.earliestMs);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">工作計劃表</h1>
        <form action="/admin/work-plan" className="flex items-center gap-2">
          <input
            type="month"
            name="month"
            defaultValue={month}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            查詢
          </button>
        </form>
      </div>

      <p className="mb-3 text-sm text-gray-500">
        {month}：以下課程仍有未準備好物資的課堂
      </p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          此月份物資已全部準備好 🎉
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">學校</th>
                <th className="px-4 py-2.5 font-medium">課程</th>
                <th className="px-4 py-2.5 font-medium">最早未完成日期</th>
                <th className="px-4 py-2.5 font-medium">課堂代號</th>
                <th className="px-4 py-2.5 font-medium">備註</th>
                <th className="px-4 py-2.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const e = r.earliest as {
                  date: Date;
                  code: number;
                  status: MaterialPrepStatus;
                } | null;
                return (
                  <tr
                    key={r.courseId}
                    className="border-b border-gray-100 align-top last:border-b-0"
                  >
                    <td className="px-4 py-3">{r.schoolName}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/courses/${r.courseId}`}
                        className="hover:underline"
                      >
                        {r.courseName}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {e ? e.date.toISOString().slice(0, 10) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {e ? (
                        <>
                          L{e.code}
                          <span className="ml-1 text-xs text-rose-600">
                            ({MAT[e.status]})
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-md whitespace-pre-wrap px-4 py-3 text-gray-600">
                      {r.workPlanNote || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/courses/${r.courseId}/edit`}
                          className="rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                        >
                          編輯
                        </Link>
                        <UpdateStatusButton
                          courseId={r.courseId}
                          month={month}
                          groups={r.modalGroups}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
