import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LessonForm from "../../LessonForm";
import { updateLesson } from "../../actions";

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  const [course, lesson, tutors] = await Promise.all([
    prisma.course.findUnique({ where: { id } }),
    prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { group: true, checkIns: true },
    }),
    prisma.user.findMany({
      where: { role: "TUTOR", isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!course || !lesson) notFound();

  const hm = (d: Date) =>
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Hong_Kong",
    });
  const effId = lesson.substituteTutorId ?? lesson.tutorId;
  const ci =
    lesson.checkIns.find((c) => c.tutorId === effId) ?? lesson.checkIns[0];

  return (
    <LessonForm
      action={updateLesson.bind(null, lessonId, id)}
      lesson={lesson}
      groupName={lesson.group.name}
      tutors={tutors}
      title="編輯課堂"
      backHref={`/admin/courses/${id}/lessons`}
      checkInTime={ci ? hm(ci.checkInAt) : undefined}
      checkOutTime={ci?.checkOutAt ? hm(ci.checkOutAt) : undefined}
    />
  );
}
