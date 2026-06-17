"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MaterialPrepStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// 批量設定所選課堂的物資準備狀態（同步 課程進度表 / 課堂詳情）
export async function setMaterialStatusBatch(
  courseId: string,
  formData: FormData
) {
  const lessonIds = formData.getAll("lessonIds").map(String).filter(Boolean);
  const status = String(formData.get("materialStatus") ?? "") as MaterialPrepStatus;
  const month = String(formData.get("month") ?? "").trim();
  if (lessonIds.length === 0 || !status) return;

  await prisma.lesson.updateMany({
    where: { id: { in: lessonIds }, group: { courseId } },
    data: { materialStatus: status },
  });

  revalidatePath("/admin/work-plan");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/admin/courses/${courseId}/lessons`);
  redirect(`/admin/work-plan${month ? `?month=${month}` : ""}`);
}
