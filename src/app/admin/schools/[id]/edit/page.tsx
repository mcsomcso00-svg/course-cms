import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SchoolForm from "../../SchoolForm";
import { updateSchool } from "../../actions";

export default async function EditSchoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const school = await prisma.school.findUnique({ where: { id } });
  if (!school) notFound();

  return (
    <SchoolForm
      action={updateSchool.bind(null, id)}
      school={school}
      title="編輯學校"
    />
  );
}
