import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import JcDetail from "@/components/JcDetail";

export default async function TutorJcDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/tutor-login");
  const { id } = await params;

  const jc = await prisma.jobConfirmation.findUnique({
    where: { id },
    include: {
      tutor: true,
      course: { include: { school: true } },
      lessons: { include: { group: true }, orderBy: { date: "asc" } },
    },
  });
  if (!jc || jc.tutorId !== session.user.id) notFound();

  return (
    <div>
      <Link
        href="/tutor/confirmations"
        className="text-sm text-gray-500 hover:underline"
      >
        ← 返回
      </Link>
      <h2 className="mb-3 mt-1 text-lg font-bold">工作確認書詳情</h2>
      <JcDetail jc={jc} />
    </div>
  );
}
