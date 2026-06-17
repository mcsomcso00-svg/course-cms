import Link from "next/link";
import type { MaterialPrepStatus, TutorPrepStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const MAT: Record<MaterialPrepStatus, { label: string; cls: string }> = {
  NO_CONTENT: { label: "未有內容", cls: "bg-rose-100 text-rose-700" },
  NO_MATERIAL: { label: "未有物資", cls: "bg-amber-100 text-amber-700" },
  NOT_SENT_SCHOOL: { label: "未送出學校", cls: "bg-sky-100 text-sky-700" },
  DONE: { label: "已完成", cls: "bg-emerald-100 text-emerald-700" },
};

const PREP: Record<TutorPrepStatus, { label: string; cls: string }> = {
  NOT_SENT: { label: "未發送", cls: "bg-amber-100 text-amber-700" },
  SENT: { label: "已發送", cls: "bg-emerald-100 text-emerald-700" },
  CONFIRMED: { label: "已確認", cls: "bg-emerald-200 text-emerald-800" },
};

function ddmm(d: Date) {
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; school?: string; course?: string }>;
}) {
  const sp = await searchParams;

  const years = await prisma.academicYear.findMany({
    where: { isHidden: false },
    orderBy: { sortOrder: "asc" },
  });
  const selectedYear =
    years.find((y) => y.label === sp.year) ?? years[years.length - 1];

  const qSchool = sp.school?.trim() || undefined;
  const qCourse = sp.course?.trim() || undefined;

  const courses = selectedYear
    ? await prisma.course.findMany({
        where: {
          academicYearId: selectedYear.id,
          ...(qCourse ? { name: { contains: qCourse, mode: "insensitive" } } : {}),
          ...(qSchool
            ? { school: { name: { contains: qSchool, mode: "insensitive" } } }
            : {}),
        },
        orderBy: [{ school: { name: "asc" } }, { name: "asc" }],
        include: {
          school: true,
          groups: {
            orderBy: { name: "asc" },
            include: {
              lessons: {
                where: { status: { not: "DISABLED" } },
                orderBy: { date: "asc" },
                include: { tutor: true, substitute: true },
              },
            },
          },
        },
      })
    : [];

  // 按學校分組
  const bySchool = new Map<string, { name: string; courses: typeof courses }>();
  for (const c of courses) {
    if (!bySchool.has(c.schoolId))
      bySchool.set(c.schoolId, { name: c.school.name, courses: [] });
    bySchool.get(c.schoolId)!.courses.push(c);
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">課程進度表</h1>
        <form action="/admin/progress" className="flex flex-wrap items-center gap-2">
          <select
            name="year"
            defaultValue={selectedYear?.label ?? ""}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          >
            {years.map((y) => (
              <option key={y.id} value={y.label}>
                {y.label}
              </option>
            ))}
          </select>
          <input
            name="school"
            defaultValue={qSchool ?? ""}
            placeholder="搜尋學校名"
            className="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
          <input
            name="course"
            defaultValue={qCourse ?? ""}
            placeholder="搜尋課程名"
            className="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            查詢
          </button>
        </form>
      </div>

      {/* 圖例 */}
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
        <span>物資狀態：</span>
        {Object.values(MAT).map((m) => (
          <span key={m.label} className={"rounded px-2 py-0.5 " + m.cls}>
            {m.label}
          </span>
        ))}
        <span className="ml-2">導師備課：</span>
        {Object.values(PREP).map((p) => (
          <span key={p.label} className={"rounded px-2 py-0.5 " + p.cls}>
            {p.label}
          </span>
        ))}
      </div>

      {bySchool.size === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          沒有符合條件的課程。
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(bySchool.values()).map((s) => (
            <section key={s.name}>
              <h2 className="mb-3 text-base font-semibold">{s.name}</h2>
              <div className="space-y-5">
                {s.courses.map((c) => (
                  <div key={c.id}>
                    <div className="mb-2 flex items-center gap-2">
                      <Link
                        href={`/admin/courses/${c.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {c.name}
                      </Link>
                      <Link
                        href={`/admin/courses/${c.id}/lessons`}
                        className="rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                      >
                        編輯
                      </Link>
                    </div>

                    {c.groups.length === 0 ? (
                      <p className="text-xs text-gray-400">尚未建立小組</p>
                    ) : (
                      c.groups.map((g) => (
                        <div
                          key={g.id}
                          className="mb-3 overflow-x-auto rounded-xl border border-gray-200 bg-white"
                        >
                          <table className="w-full border-collapse text-center text-xs">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-gray-700">
                                  {g.name}
                                </th>
                                {g.lessons.map((l) => (
                                  <th
                                    key={l.id}
                                    className="whitespace-nowrap px-3 py-2 font-normal text-gray-500"
                                  >
                                    {ddmm(l.date)}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <Row label="堂數">
                                {g.lessons.map((l, i) => (
                                  <td key={l.id} className="px-3 py-1.5 text-gray-500">
                                    L{i + 1}
                                  </td>
                                ))}
                              </Row>
                              <Row label="物資狀態">
                                {g.lessons.map((l) => (
                                  <td key={l.id} className="px-1.5 py-1.5">
                                    <span
                                      className={
                                        "block rounded px-1 py-1 " +
                                        MAT[l.materialStatus].cls
                                      }
                                    >
                                      {MAT[l.materialStatus].label}
                                    </span>
                                  </td>
                                ))}
                              </Row>
                              <Row label="導師備課狀態">
                                {g.lessons.map((l) => (
                                  <td key={l.id} className="px-1.5 py-1.5">
                                    <span
                                      className={
                                        "block rounded px-1 py-1 " +
                                        PREP[l.tutorPrepStatus].cls
                                      }
                                    >
                                      {PREP[l.tutorPrepStatus].label}
                                    </span>
                                  </td>
                                ))}
                              </Row>
                              <Row label="導師">
                                {g.lessons.map((l) => (
                                  <td
                                    key={l.id}
                                    className="whitespace-nowrap px-3 py-1.5 text-gray-700"
                                  >
                                    {l.substitute
                                      ? `代 ${l.substitute.name}`
                                      : l.tutor?.name ?? "—"}
                                  </td>
                                ))}
                              </Row>
                            </tbody>
                          </table>
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr className="border-b border-gray-100 last:border-b-0">
      <td className="whitespace-nowrap px-3 py-1.5 text-left text-gray-500">
        {label}
      </td>
      {children}
    </tr>
  );
}
