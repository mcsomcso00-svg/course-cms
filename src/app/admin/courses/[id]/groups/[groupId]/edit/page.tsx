import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import GroupForm from "../../GroupForm";
import { updateGroup } from "../../actions";

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string; groupId: string }>;
}) {
  const { id, groupId } = await params;
  const [course, group] = await Promise.all([
    prisma.course.findUnique({ where: { id } }),
    prisma.group.findUnique({ where: { id: groupId } }),
  ]);
  if (!course || !group) notFound();

  return (
    <GroupForm
      action={updateGroup.bind(null, groupId, id)}
      group={group}
      courseName={course.name}
      backHref={`/admin/courses/${id}`}
      title="編輯小組"
    />
  );
}
