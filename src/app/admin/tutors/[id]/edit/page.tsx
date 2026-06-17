import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TutorForm from "../../TutorForm";
import { updateTutor } from "../../actions";

export default async function EditTutorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tutor = await prisma.user.findUnique({ where: { id } });
  if (!tutor || tutor.role !== "TUTOR") notFound();

  return (
    <TutorForm action={updateTutor.bind(null, id)} tutor={tutor} title="編輯導師" />
  );
}
