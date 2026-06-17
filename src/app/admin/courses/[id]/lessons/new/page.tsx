import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LessonForm from "../LessonForm";
import { createLesson } from "../actions";

export default async function NewLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [course, groups, tutors] = await Promise.all([
    prisma.course.findUnique({ where: { id } }),
    prisma.group.findMany({ where: { courseId: id }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: "TUTOR", isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!course) notFound();

  return (
    <LessonForm
      action={createLesson.bind(null, id)}
      groups={groups}
      tutors={tutors}
      title="新增課堂"
      backHref={`/admin/courses/${id}/lessons`}
    />
  );
}
