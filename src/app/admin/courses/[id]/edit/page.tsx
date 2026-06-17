import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CourseForm from "../../CourseForm";
import { updateCourse } from "../../actions";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) notFound();

  return (
    <CourseForm
      action={updateCourse.bind(null, id)}
      course={course}
      backHref={`/admin/courses/${id}`}
      title="編輯課程"
    />
  );
}
