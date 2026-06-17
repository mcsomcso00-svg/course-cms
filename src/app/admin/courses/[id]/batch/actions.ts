"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma, TutorPrepStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function batchUpdateLessons(
  courseId: string,
  formData: FormData
) {
  const operation = String(formData.get("operation") ?? "");
  const lessonIds = formData.getAll("lessonIds").map(String).filter(Boolean);
  if (lessonIds.length === 0) return;

  const vacant = formData.get("vacant") === "on";
  let data: Prisma.LessonUncheckedUpdateManyInput = {};

  switch (operation) {
    case "REPLACE_TUTOR": {
      const tutorId = String(formData.get("tutorId") ?? "");
      data = { tutorId: vacant || !tutorId ? null : tutorId };
      break;
    }
    case "REPLACE_SUBSTITUTE": {
      const subId = String(formData.get("substituteTutorId") ?? "");
      data = { substituteTutorId: vacant || !subId ? null : subId };
      break;
    }
    case "TUTOR_PREP": {
      const status = String(formData.get("tutorPrepStatus") ?? "NOT_SENT");
      data = { tutorPrepStatus: status as TutorPrepStatus };
      break;
    }
    case "CHANGE_FEE": {
      const feeStr = String(formData.get("tutorFee") ?? "").trim();
      const fee = feeStr ? Number(feeStr) : NaN;
      data = { tutorFee: vacant || Number.isNaN(fee) ? null : fee };
      break;
    }
    default:
      return;
  }

  await prisma.lesson.updateMany({
    where: { id: { in: lessonIds }, group: { courseId } },
    data,
  });

  revalidatePath(`/admin/courses/${courseId}/lessons`);
  revalidatePath(`/admin/courses/${courseId}/batch`);
  redirect(`/admin/courses/${courseId}/lessons`);
}

// 製作JC：為所選課堂之導師（每位導師一張）建立工作確認書，並連結課堂
export async function createJobConfirmations(
  courseId: string,
  formData: FormData
) {
  const lessonIds = formData.getAll("lessonIds").map(String).filter(Boolean);
  if (lessonIds.length === 0) return;

  const feeStr = String(formData.get("jcFee") ?? "").trim();
  const fee = feeStr ? Number(feeStr) : null;
  const agreement = String(formData.get("jcAgreement") ?? "").trim() || null;

  // 表單上選擇的導師（更換代課導師 → 代課欄；否則 → 導師欄）
  const operation = String(formData.get("operation") ?? "");
  const isSub = operation === "REPLACE_SUBSTITUTE";
  const selectedTutorId =
    (isSub
      ? String(formData.get("substituteTutorId") ?? "")
      : String(formData.get("tutorId") ?? "")
    ).trim() || null;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  const lessons = await prisma.lesson.findMany({
    where: { id: { in: lessonIds }, group: { courseId } },
    select: { id: true, tutorId: true, substituteTutorId: true },
  });
  const validIds = lessons.map((l) => l.id);
  if (validIds.length === 0) return;

  // 製作 JC 同時套用導師指派（與「保存」一致），確保確認書有導師
  if (selectedTutorId) {
    const data: Prisma.LessonUncheckedUpdateManyInput = isSub
      ? { substituteTutorId: selectedTutorId }
      : { tutorId: selectedTutorId };
    await prisma.lesson.updateMany({ where: { id: { in: validIds } }, data });
  }

  // 決定每張確認書的導師
  const byTutor = new Map<string, string[]>();
  if (selectedTutorId) {
    byTutor.set(selectedTutorId, validIds);
  } else {
    for (const l of lessons) {
      const t = l.substituteTutorId ?? l.tutorId;
      if (!t) continue;
      if (!byTutor.has(t)) byTutor.set(t, []);
      byTutor.get(t)!.push(l.id);
    }
  }

  for (const [tutorId, ids] of byTutor) {
    await prisma.jobConfirmation.create({
      data: {
        tutorId,
        courseId,
        title: `${course?.name ?? "課程"} 導師工作確認書`,
        position: "導師",
        tutorFee: fee !== null && !Number.isNaN(fee) ? fee : null,
        otherAgreement: agreement,
        status: "PENDING",
        lessons: { connect: ids.map((id) => ({ id })) },
      },
    });
  }

  revalidatePath(`/admin/courses/${courseId}/confirmations`);
  redirect(`/admin/courses/${courseId}/confirmations`);
}
