import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CourseForm from "@/app/admin/courses/CourseForm";
import { createCourse } from "@/app/admin/courses/actions";

export default async function NewCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { id: schoolId } = await params;
  const { year } = await searchParams;

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) notFound();

  const academicYear =
    (year
      ? await prisma.academicYear.findUnique({ where: { label: year } })
      : null) ??
    (await prisma.academicYear.findFirst({
      where: { isHidden: false },
      orderBy: { sortOrder: "desc" },
    }));
  if (!academicYear) notFound();

  return (
    <CourseForm
      action={createCourse.bind(null, schoolId, academicYear.id)}
      backHref="/admin"
      title={`新增課程 · ${school.name}`}
    />
  );
}
