import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function fmtDateTime(d: Date) {
  return d.toLocaleString("zh-HK", {
    timeZone: "Asia/Hong_Kong",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TutorPayPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const me = session.user.id;

  const checkIns = await prisma.checkIn.findMany({
    where: { tutorId: me },
    include: {
      lesson: {
        include: { group: { include: { course: { include: { school: true } } } } },
      },
    },
    orderBy: { checkInAt: "desc" },
  });

  const total = checkIns.reduce((sum, c) => sum + Number(c.payAmount), 0);

  return (
    <div>
      <h2 className="mb-3 text-lg font-bold">我的紀錄</h2>

      <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="text-xs text-gray-500">累計堂費</div>
        <div className="text-2xl font-bold">${total}</div>
        <div className="mt-1 text-xs text-gray-400">{checkIns.length} 次打卡</div>
      </div>

      {checkIns.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          尚未有打卡紀錄。
        </p>
      ) : (
        <div className="space-y-2">
          {checkIns.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-gray-200 bg-white p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {c.lesson.group.course.name}
                </span>
                <span className="text-sm font-semibold">
                  ${Number(c.payAmount)}
                  <span
                    className={
                      "ml-1 text-[11px] " +
                      (c.payPercent === 100 ? "text-emerald-600" : "text-amber-600")
                    }
                  >
                    {c.payPercent}%
                  </span>
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {c.lesson.group.course.school.name} · {c.lesson.group.name}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                上堂 {fmtDateTime(c.checkInAt)}
                {c.checkOutAt && ` · 落堂 ${fmtDateTime(c.checkOutAt)}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
