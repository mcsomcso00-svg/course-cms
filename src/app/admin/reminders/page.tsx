import Link from "next/link";
import { prisma } from "@/lib/prisma";

function hm(d: Date) {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Hong_Kong",
  });
}

export default async function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; school?: string; course?: string }>;
}) {
  const sp = await searchParams;

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Hong_Kong",
  });
  const dateStr =
    sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today;
  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

  const qSchool = sp.school?.trim() || undefined;
  const qCourse = sp.course?.trim() || undefined;

  const lessons = await prisma.lesson.findMany({
    where: {
      date: { gte: dayStart, lte: dayEnd },
      status: { not: "DISABLED" },
      group: {
        course: {
          ...(qCourse ? { name: { contains: qCourse, mode: "insensitive" } } : {}),
          ...(qSchool
            ? { school: { name: { contains: qSchool, mode: "insensitive" } } }
            : {}),
        },
      },
    },
    include: {
      tutor: true,
      substitute: true,
      group: { include: { course: { include: { school: true } } } },
    },
    orderBy: { startAt: "asc" },
  });

  // 按學校 → 課程 分組
  const bySchool = new Map<
    string,
    {
      schoolName: string;
      courses: Map<string, { courseName: string; lessons: typeof lessons }>;
    }
  >();
  for (const l of lessons) {
    const school = l.group.course.school;
    const course = l.group.course;
    if (!bySchool.has(school.id))
      bySchool.set(school.id, { schoolName: school.name, courses: new Map() });
    const sc = bySchool.get(school.id)!;
    if (!sc.courses.has(course.id))
      sc.courses.set(course.id, { courseName: course.name, lessons: [] });
    sc.courses.get(course.id)!.lessons.push(l);
  }
  const schools = Array.from(bySchool.values()).sort((a, b) =>
    a.schoolName.localeCompare(b.schoolName)
  );

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">
          上堂提醒
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({dateStr})
          </span>
        </h1>
        <form action="/admin/reminders" className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={dateStr}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
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

      {schools.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          {dateStr} 沒有上課的課堂。
        </div>
      ) : (
        <div className="space-y-6">
          {schools.map((s) => (
            <section key={s.schoolName}>
              <h2 className="mb-2 border-b border-gray-200 pb-1 text-base font-semibold">
                學校名稱：{s.schoolName}
              </h2>
              <div className="space-y-4">
                {Array.from(s.courses.values()).map((c) => (
                  <div key={c.courseName} className="sm:flex sm:gap-4">
                    <div className="mb-1 shrink-0 pt-2 text-sm text-gray-500 sm:w-56">
                      課程名稱：{c.courseName}
                    </div>
                    <div className="flex-1 overflow-x-auto rounded-lg border border-gray-200 bg-white">
                      <table className="w-full text-sm">
                        <tbody>
                          {c.lessons.flatMap((l) => {
                            const rows = [
                              <tr
                                key={l.id + "-t"}
                                className="border-b border-gray-100 last:border-b-0"
                              >
                                <td className="px-3 py-2 font-medium">
                                  {l.group.name}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                                  {hm(l.startAt)}-{hm(l.endAt)}
                                </td>
                                <td className="px-3 py-2 text-gray-500">導師</td>
                                <td className="px-3 py-2">
                                  {l.tutor ? (
                                    l.tutor.name
                                  ) : (
                                    <span className="text-gray-400">空缺</span>
                                  )}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                                  {l.tutor?.phone ?? ""}
                                </td>
                              </tr>,
                            ];
                            if (l.substitute) {
                              rows.push(
                                <tr
                                  key={l.id + "-s"}
                                  className="border-b border-gray-100 bg-amber-50/40 last:border-b-0"
                                >
                                  <td className="px-3 py-2 font-medium">
                                    {l.group.name}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                                    {hm(l.startAt)}-{hm(l.endAt)}
                                  </td>
                                  <td className="px-3 py-2 text-amber-700">代課</td>
                                  <td className="px-3 py-2">{l.substitute.name}</td>
                                  <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                                    {l.substitute.phone ?? ""}
                                  </td>
                                </tr>
                              );
                            }
                            return rows;
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400">
        註：助教 / 助理 角色需要一個「助教指派」資料模型，暫未建立（見待確認問題）。
        <Link href="/admin" className="ml-2 underline">
          返回學校與課程
        </Link>
      </p>
    </div>
  );
}
