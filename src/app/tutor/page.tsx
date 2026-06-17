import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import CheckInCard from "./CheckInCard";

function hm(d: Date) {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Hong_Kong",
  });
}

export default async function TutorHome() {
  const session = await auth();
  if (!session) redirect("/tutor-login");
  const me = session.user.id;

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Hong_Kong",
  });
  const dayStart = new Date(`${today}T00:00:00.000Z`);
  const dayEnd = new Date(`${today}T23:59:59.999Z`);

  const lessons = await prisma.lesson.findMany({
    where: {
      status: { not: "DISABLED" },
      date: { gte: dayStart, lte: dayEnd },
      OR: [{ tutorId: me }, { substituteTutorId: me }],
    },
    include: {
      group: { include: { course: { include: { school: true } } } },
      checkIns: { where: { tutorId: me } },
    },
    orderBy: { startAt: "asc" },
  });

  return (
    <div>
      {lessons.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          今日沒有需要上堂的課堂。
        </p>
      ) : (
        <div className="space-y-3">
          {lessons.map((l) => {
            const ci = l.checkIns[0];
            return (
              <CheckInCard
                key={l.id}
                lessonId={l.id}
                schoolName={l.group.course.school.name}
                courseName={l.group.course.name}
                groupName={l.group.name}
                role={l.substituteTutorId === me ? "代課" : "導師"}
                timeLabel={`${hm(l.startAt)}-${hm(l.endAt)}`}
                checkedInAt={ci ? hm(ci.checkInAt) : null}
                checkedOutAt={ci?.checkOutAt ? hm(ci.checkOutAt) : null}
                payPercent={ci?.payPercent ?? null}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
