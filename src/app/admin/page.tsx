import Link from "next/link";
import type { CourseStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import AddYearButton from "./AddYearButton";
import ConfirmButton from "@/components/ConfirmButton";
import { hideYear, unhideYear } from "./actions";

const STATUS: Record<CourseStatus, { label: string; cls: string }> = {
  PLANNED: { label: "計劃中", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  CONFIRMED: { label: "已確認", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ONGOING: { label: "進行中", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  COMPLETED: { label: "已完成", cls: "bg-gray-100 text-gray-500 border-gray-200" },
  CANCELLED: { label: "已取消", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) u.set(k, v);
  const s = u.toString();
  return s ? `?${s}` : "";
}

function Dot({ cls, title }: { cls: string; title: string }) {
  return (
    <span
      title={title}
      className={"inline-block h-2.5 w-2.5 rounded-full " + cls}
    />
  );
}

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    school?: string;
    course?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const sp = await searchParams;

  const [years, hiddenYears] = await Promise.all([
    prisma.academicYear.findMany({
      where: { isHidden: false },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.academicYear.findMany({
      where: { isHidden: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  const selectedYear =
    years.find((y) => y.label === sp.year) ?? years[years.length - 1];

  const qSchool = sp.school?.trim() || undefined;
  const qCourse = sp.course?.trim() || undefined;
  const from = sp.from?.trim() || undefined;
  const to = sp.to?.trim() || undefined;
  const hasRange = !!(from || to);
  const fromMs = from ? new Date(`${from}T00:00:00.000Z`).getTime() : -Infinity;
  const toMs = to ? new Date(`${to}T23:59:59.999Z`).getTime() : Infinity;

  const schools = selectedYear
    ? await prisma.school.findMany({
        where: qSchool
          ? { name: { contains: qSchool, mode: "insensitive" } }
          : {},
        orderBy: { name: "asc" },
        include: {
          courses: {
            where: {
              academicYearId: selectedYear.id,
              ...(qCourse
                ? { name: { contains: qCourse, mode: "insensitive" } }
                : {}),
            },
            orderBy: { name: "asc" },
            include: {
              _count: { select: { groups: true } },
              groups: {
                select: {
                  lessons: {
                    select: {
                      date: true,
                      status: true,
                      tutorId: true,
                      substituteTutorId: true,
                      coursePrepStatus: true,
                      materialStatus: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    : [];

  const visibleSchools = qCourse
    ? schools.filter((s) => s.courses.length > 0)
    : schools;

  const sameDay = from && to && from === to;

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* 頂部：標題 + 搜尋 + 新增學校 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">學校與課程</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/import"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            ⬆ 批量匯入
          </Link>
          <Link
            href="/admin/schools/new"
            className="rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            + 新增學校
          </Link>
        </div>
      </div>

      {/* 學年分頁（保留現有篩選） */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {years.map((y) => {
          const active = selectedYear?.id === y.id;
          return (
            <Link
              key={y.id}
              href={`/admin${qs({ year: y.label, school: qSchool, course: qCourse, from, to })}`}
              className={
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors " +
                (active
                  ? "bg-black text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100")
              }
            >
              {y.label}
            </Link>
          );
        })}
        <AddYearButton />
        {selectedYear && (
          <ConfirmButton
            action={hideYear.bind(null, selectedYear.id)}
            message={`確定隱藏學年「${selectedYear.label}」？可於下方「已隱藏」重新顯示。`}
            className="rounded-full px-3.5 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
          >
            - 隱藏年度
          </ConfirmButton>
        )}
      </div>

      {/* 已隱藏年度 */}
      {hiddenYears.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-400">
          <span>已隱藏：</span>
          {hiddenYears.map((y) => (
            <form key={y.id} action={unhideYear.bind(null, y.id)}>
              <button
                type="submit"
                title="按一下取消隱藏"
                className="rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-gray-500 hover:bg-gray-100"
              >
                {y.label} ↩
              </button>
            </form>
          ))}
        </div>
      )}

      {/* 篩選列：日期範圍 + 搜尋 */}
      <form
        action="/admin"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-3"
      >
        {selectedYear && (
          <input type="hidden" name="year" value={selectedYear.label} />
        )}
        <div>
          <label className="mb-1 block text-xs text-gray-500">從</label>
          <input
            type="date"
            name="from"
            defaultValue={from ?? ""}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">至</label>
          <input
            type="date"
            name="to"
            defaultValue={to ?? ""}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div className="flex-1" />
        <div>
          <label className="mb-1 block text-xs text-gray-500">搜尋</label>
          <div className="flex items-center gap-2">
            <input
              name="school"
              defaultValue={qSchool ?? ""}
              placeholder="學校名"
              className="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            <input
              name="course"
              defaultValue={qCourse ?? ""}
              placeholder="課程名"
              className="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            <button
              type="submit"
              className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              套用
            </button>
            {(hasRange || qSchool || qCourse) && (
              <Link
                href={`/admin${qs({ year: selectedYear?.label })}`}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              >
                清除
              </Link>
            )}
          </div>
        </div>
      </form>

      {/* 狀態圓點說明 */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Dot cls="bg-red-500" title="未有課程內容" /> 未有課程內容
        </span>
        <span className="flex items-center gap-1">
          <Dot cls="bg-yellow-400" title="未有導師" /> 未有導師
        </span>
        <span className="flex items-center gap-1">
          <Dot cls="bg-purple-500" title="未有教材物資" /> 未有教材物資
        </span>
        <span className="flex items-center gap-1">
          <Dot cls="bg-blue-500" title="未出完 invoice" /> 未出完 invoice
        </span>
      </div>

      {/* 學校列表 */}
      {visibleSchools.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          未有符合條件的學校。按「+ 新增學校」開始。
        </div>
      ) : (
        <div className="space-y-8">
          {visibleSchools.map((school) => (
            <section key={school.id}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-base font-semibold">{school.name}</h2>
                <Link
                  href={`/admin/schools/${school.id}/edit`}
                  className="rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                >
                  編輯
                </Link>
                <span className="text-xs text-gray-400">
                  {school.courses.length} 個課程
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {school.courses.map((course) => {
                  const s = STATUS[course.status];
                  const active = course.groups
                    .flatMap((g) => g.lessons)
                    .filter(
                      (l) =>
                        l.status !== "DISABLED" && l.status !== "CANCELLED"
                    );
                  const inRange = active.filter((l) => {
                    const ms = l.date.getTime();
                    return ms >= fromMs && ms <= toMs;
                  }).length;
                  const highlight = hasRange && inRange > 0;

                  // 狀態圓點（任何一堂出現問題即亮起）
                  const dotRed = active.some((l) => l.coursePrepStatus === "NONE");
                  const dotYellow = active.some(
                    (l) => !l.tutorId && !l.substituteTutorId
                  );
                  const dotPurple = active.some((l) => l.materialStatus !== "DONE");
                  const dotBlue = course.invoiceStatus === "INCOMPLETE";

                  return (
                    <Link
                      key={course.id}
                      href={`/admin/courses/${course.id}`}
                      className={
                        "group rounded-xl border bg-white p-4 transition-shadow hover:shadow-md " +
                        (highlight
                          ? "border-black ring-1 ring-black"
                          : "border-gray-200")
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium group-hover:underline">
                          {course.name}
                        </span>
                        <span
                          className={
                            "shrink-0 rounded-full border px-2 py-0.5 text-[11px] " +
                            s.cls
                          }
                        >
                          {s.label}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {course._count.groups} 個小組
                        </span>
                        <div className="ml-auto flex items-center gap-1">
                          {dotRed && <Dot cls="bg-red-500" title="有課堂未有課程內容" />}
                          {dotYellow && (
                            <Dot cls="bg-yellow-400" title="有課堂未有導師" />
                          )}
                          {dotPurple && (
                            <Dot cls="bg-purple-500" title="有課堂未有教材物資" />
                          )}
                          {dotBlue && (
                            <Dot cls="bg-blue-500" title="未出完 invoice" />
                          )}
                        </div>
                      </div>
                      {highlight && (
                        <div className="mt-2">
                          <span className="rounded-full bg-black px-2 py-0.5 text-[11px] font-medium text-white">
                            {sameDay
                              ? `當日 ${inRange} 堂`
                              : `範圍內 ${inRange} 堂`}
                          </span>
                        </div>
                      )}
                    </Link>
                  );
                })}

                <Link
                  href={`/admin/schools/${school.id}/courses/new${qs({ year: selectedYear?.label })}`}
                  className="flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700"
                >
                  + 新增課程
                </Link>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
