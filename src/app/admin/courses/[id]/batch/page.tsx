import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CourseHeader from "../CourseHeader";
import BatchForm from "./BatchForm";

const WD = ["日", "一", "二", "三", "四", "五", "六"];

export default async function BatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) notFound();

  const [groups, tutors] = await Promise.all([
    prisma.group.findMany({
      where: { courseId: id },
      orderBy: { name: "asc" },
      include: {
        lessons: {
          orderBy: { date: "asc" },
          select: { id: true, date: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "TUTOR", isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const groupOpts = groups.map((g) => ({
    id: g.id,
    name: g.name,
    lessons: g.lessons.map((l) => {
      const ds = l.date.toISOString().slice(0, 10);
      return { id: l.id, label: `${ds}(${WD[l.date.getUTCDay()]})` };
    }),
  }));

  return (
    <div className="mx-auto max-w-4xl p-6">
      <CourseHeader course={course} active="batch" />
      <BatchForm courseId={id} groups={groupOpts} tutors={tutors} />
    </div>
  );
}
