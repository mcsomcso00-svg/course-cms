"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function signJob(
  jcId: string,
  signatureData: string,
  agreed: boolean
): Promise<{ ok: boolean; message?: string }> {
  const session = await auth();
  if (!session || session.user.role !== "TUTOR")
    return { ok: false, message: "未登入" };

  const jc = await prisma.jobConfirmation.findUnique({ where: { id: jcId } });
  if (!jc || jc.tutorId !== session.user.id)
    return { ok: false, message: "找不到工作確認書" };
  if (jc.status !== "PENDING")
    return { ok: false, message: "此確認書已處理，不能再簽署" };
  if (!agreed) return { ok: false, message: "請先勾選同意聲明" };
  if (!signatureData) return { ok: false, message: "請先簽名" };

  await prisma.jobConfirmation.update({
    where: { id: jcId },
    data: {
      signatureData,
      agreed,
      status: "SIGNED",
      signedAt: new Date(),
    },
  });

  revalidatePath("/tutor/confirmations");
  return { ok: true };
}
