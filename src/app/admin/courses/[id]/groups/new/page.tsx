import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import GroupForm from "../GroupForm";
import { createGroup } from "../actions";

export default async function NewGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) notFound();

  return (
    <GroupForm
      action={createGroup.bind(null, id)}
      courseName={course.name}
      backHref={`/admin/courses/${id}`}
      title="新增小組"
    />
  );
}
