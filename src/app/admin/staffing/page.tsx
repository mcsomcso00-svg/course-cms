import { prisma } from "@/lib/prisma";

export default async function StaffingPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    school?: string;
    course?: string;
  }>;
}) {
  const sp = await searchParams;

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Hong_Kong",
  });
  const t = new Date(`${today}T00:00:00.000Z`);
  const t30 = new Date(t);
  t30.setUTCDate(t30.getUTCDate() + 30);

  const from =
    sp.from && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) ? sp.from : today;
  const to =
    sp.to && /^\d{4}-\d{2}-\d{2}$/.test(sp.to)
      ? sp.to
      : t30.toISOString().slice(0, 10);

  const qSchool = sp.school?.trim() || undefined;
  const qCourse = sp.course?.trim() || undefined;

  const lessons = await prisma.lesson.findMany({
    where: {
      date: {
        gte: new Date(`${from}T00:00:00.000Z`),
        lte: new Date(`${to}T23:59:59.999Z`),
      },
      status: { not: "DISABLED" },
      // 空缺（無導師）或 有代課
      OR: [{ tutorId: null }, { substituteTutorId: { not: null } }],
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
    orderBy: { date: "asc" },
  });

  const inputCls =
    "rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">導師請假表</h1>
        <form action="/admin/staffing" className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-gray-500">課堂日期</label>
          <input type="date" name="from" defaultValue={from} className={inputCls} />
          <span className="text-gray-400">至</span>
          <input type="date" name="to" defaultValue={to} className={inputCls} />
          <input
            name="school"
            defaultValue={qSchool ?? ""}
            placeholder="學校名"
            className={inputCls + " w-28"}
          />
          <input
            name="course"
            defaultValue={qCourse ?? ""}
            placeholder="課程名"
            className={inputCls + " w-28"}
          />
          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            查詢
          </button>
        </form>
      </div>

      {lessons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          此時段內沒有空缺或代課的課堂。
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">學校</th>
                <th className="px-4 py-2.5 font-medium">課程</th>
                <th className="px-4 py-2.5 font-medium">小組</th>
                <th className="px-4 py-2.5 font-medium">日期</th>
                <th className="px-4 py-2.5 font-medium">導師</th>
                <th className="px-4 py-2.5 font-medium">代課</th>
                <th className="px-4 py-2.5 font-medium" title="用途待確認">
                  檢查
                </th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((l) => (
                <tr key={l.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-2.5">{l.group.course.school.name}</td>
                  <td className="px-4 py-2.5">{l.group.course.name}</td>
                  <td className="px-4 py-2.5">{l.group.name}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {l.date.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-2.5">
                    {l.tutor ? (
                      l.tutor.name
                    ) : (
                      <span className="text-rose-600">空缺</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {l.substitute ? (
                      <span>
                        {l.substitute.name}
                        <span className="ml-1 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">
                          代課
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-2 text-[11px] text-gray-400">
                      {["PC", "TM", "CD"].map((k) => (
                        <label key={k} className="flex items-center gap-1">
                          <input type="checkbox" disabled className="accent-gray-400" />
                          {k}
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">
        顯示時段內「空缺」或「有代課」的課堂。「檢查」欄 (PC / TM / CD)
        用途待確認，暫以停用 placeholder 顯示；「更換導師」與「代課」的區分需更換紀錄，亦待確認。
      </p>
    </div>
  );
}
