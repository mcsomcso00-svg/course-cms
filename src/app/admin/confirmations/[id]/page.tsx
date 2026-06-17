import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import JcDetail from "@/components/JcDetail";

export default async function AdminJcDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jc = await prisma.jobConfirmation.findUnique({
    where: { id },
    include: {
      tutor: true,
      course: { include: { school: true } },
      lessons: { include: { group: true }, orderBy: { date: "asc" } },
    },
  });
  if (!jc) notFound();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link
        href="/admin/confirmations"
        className="text-sm text-gray-500 hover:underline"
      >
        ← 工作確認書列表
      </Link>
      <h1 className="mb-4 mt-1 text-xl font-bold tracking-tight">
        工作確認書詳情
      </h1>
      <JcDetail jc={jc} />
    </div>
  );
}
