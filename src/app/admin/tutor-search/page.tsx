import { prisma } from "@/lib/prisma";

const WD = ["日", "一", "二", "三", "四", "五", "六"];

function hm(d: Date) {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Hong_Kong",
  });
}

function fmtDates(dates: Date[]) {
  const byMonth = new Map<string, number[]>();
  for (const d of [...dates].sort((a, b) => a.getTime() - b.getTime())) {
    const key = `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(d.getUTCDate());
  }
  return Array.from(byMonth.entries())
    .map(([k, days]) => `${k}${days.join("、")}日`)
    .join("；");
}

type Agg = {
  school: string;
  course: string;
  role: string;
  time: string;
  weekday: number;
  dates: Date[];
};

export default async function TutorSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; q?: string }>;
}) {
  const sp = await searchParams;

  const years = await prisma.academicYear.findMany({
    where: { isHidden: false },
    orderBy: { sortOrder: "asc" },
  });
  const selectedYear =
    years.find((y) => y.label === sp.year) ?? years[years.length - 1];
  const q = sp.q?.trim() || undefined;

  const lessons = selectedYear
    ? await prisma.lesson.findMany({
        where: {
          status: { not: "DISABLED" },
          group: { course: { academicYearId: selectedYear.id } },
          OR: [{ tutorId: { not: null } }, { substituteTutorId: { not: null } }],
        },
        include: {
          tutor: true,
          substitute: true,
          group: { include: { course: { include: { school: true } } } },
        },
        orderBy: { date: "asc" },
      })
    : [];

  // 以導師（人）分組，再以 課程/小組/職位/時間 聚合日期
  const byTutor = new Map<
    string,
    { name: string; rows: Map<string, Agg> }
  >();

  function add(
    userId: string,
    name: string,
    l: (typeof lessons)[number],
    role: string
  ) {
    if (!byTutor.has(userId)) byTutor.set(userId, { name, rows: new Map() });
    const t = byTutor.get(userId)!;
    const course = l.group.course;
    const time = `${hm(l.startAt)}-${hm(l.endAt)}`;
    const key = `${course.id}|${l.groupId}|${role}|${time}`;
    if (!t.rows.has(key))
      t.rows.set(key, {
        school: course.school.name,
        course: course.name,
        role,
        time,
        weekday: l.date.getUTCDay(),
        dates: [],
      });
    t.rows.get(key)!.dates.push(l.date);
  }

  for (const l of lessons) {
    if (l.tutor) add(l.tutor.id, l.tutor.name, l, "導師");
    if (l.substitute) add(l.substitute.id, l.substitute.name, l, "代課");
  }

  let tutors = Array.from(byTutor.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  if (q) tutors = tutors.filter((t) => t.name.includes(q));

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">導師搜索</h1>
        <form action="/admin/tutor-search" className="flex items-center gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="搜尋導師姓名"
            className="w-40 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
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
          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            查詢
          </button>
        </form>
      </div>

      {tutors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          沒有符合的導師課堂。
        </div>
      ) : (
        <div className="space-y-6">
          {tutors.map((t) => (
            <section key={t.name}>
              <h2 className="mb-2 text-base font-semibold">{t.name}</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">學校名稱</th>
                      <th className="px-4 py-2 font-medium">課程名稱</th>
                      <th className="px-4 py-2 font-medium">職位</th>
                      <th className="px-4 py-2 font-medium">上課時間</th>
                      <th className="px-4 py-2 font-medium">星期</th>
                      <th className="px-4 py-2 font-medium">課堂日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(t.rows.values()).map((r, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-100 align-top last:border-b-0"
                      >
                        <td className="px-4 py-2">{r.school}</td>
                        <td className="px-4 py-2">{r.course}</td>
                        <td className="px-4 py-2">
                          {r.role === "代課" ? (
                            <span className="text-amber-700">代課</span>
                          ) : (
                            "導師"
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-gray-600">
                          {r.time}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          星期{WD[r.weekday]}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {fmtDates(r.dates)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
