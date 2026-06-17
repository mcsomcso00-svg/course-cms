import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import UserForm from "../../UserForm";
import { updateAdmin } from "../../actions";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "ADMIN") notFound();

  return (
    <UserForm action={updateAdmin.bind(null, id)} user={user} title="編輯管理員" />
  );
}
