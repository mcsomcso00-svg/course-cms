"use server";

import { revalidatePath } from "next/cache";
import type { ConfirmationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function setConfirmationStatus(
  confId: string,
  courseId: string,
  status: ConfirmationStatus
) {
  await prisma.jobConfirmation.update({
    where: { id: confId },
    data: { status },
  });
  revalidatePath(`/admin/courses/${courseId}/confirmations`);
}
