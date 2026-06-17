"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  LessonStatus,
  MaterialPrepStatus,
  PrepStatus,
  TutorPrepStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

function str(formData: FormData, k: string) {
  const v = formData.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

// 由 date (YYYY-MM-DD) + time (HH:MM) 組成香港時間的 DateTime
function hk(dateStr: string, time: string) {
  return new Date(`${dateStr}T${time}:00+08:00`);
}

function dateOnly(dateStr: string) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function lessonFields(formData: FormData) {
  const date = str(formData, "date");
  const startTime = str(formData, "startTime") ?? "00:00";
  const endTime = str(formData, "endTime") ?? "00:00";
  const feeStr = str(formData, "tutorFee");
  const fee = feeStr ? Number(feeStr) : null;
  return {
    date: date ? dateOnly(date) : undefined,
    startAt: date ? hk(date, startTime) : undefined,
    endAt: date ? hk(date, endTime) : undefined,
    status: (str(formData, "status") ?? "SCHEDULED") as LessonStatus,
    coursePrepStatus: (str(formData, "coursePrepStatus") ?? "NONE") as PrepStatus,
    materialStatus: (str(formData, "materialStatus") ??
      "NO_CONTENT") as MaterialPrepStatus,
    tutorPrepStatus: (str(formData, "tutorPrepStatus") ??
      "NOT_SENT") as TutorPrepStatus,
    tutorId: str(formData, "tutorId"),
    substituteTutorId: str(formData, "substituteTutorId"),
    tutorFee: fee !== null && !Number.isNaN(fee) ? fee : null,
    notes: str(formData, "notes"),
  };
}

export async function createLesson(courseId: string, formData: FormData) {
  const groupId = str(formData, "groupId");
  const f = lessonFields(formData);
  if (!groupId || !f.date) return;
  await prisma.lesson.create({
    data: {
      groupId,
      date: f.date,
      startAt: f.startAt!,
      endAt: f.endAt!,
      status: f.status,
      coursePrepStatus: f.coursePrepStatus,
      materialStatus: f.materialStatus,
      tutorPrepStatus: f.tutorPrepStatus,
      tutorId: f.tutorId,
      substituteTutorId: f.substituteTutorId,
      tutorFee: f.tutorFee,
      notes: f.notes,
    },
  });
  revalidatePath(`/admin/courses/${courseId}/lessons`);
  redirect(`/admin/courses/${courseId}/lessons`);
}

export async function updateLesson(
  lessonId: string,
  courseId: string,
  formData: FormData
) {
  const f = lessonFields(formData);
  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      ...(f.date ? { date: f.date, startAt: f.startAt, endAt: f.endAt } : {}),
      status: f.status,
      coursePrepStatus: f.coursePrepStatus,
      materialStatus: f.materialStatus,
      tutorPrepStatus: f.tutorPrepStatus,
      tutorId: f.tutorId,
      substituteTutorId: f.substituteTutorId,
      tutorFee: f.tutorFee,
      notes: f.notes,
    },
  });

  // 導師打卡時間（管理員可手動設定上堂 / 落堂時間）
  const dateStr = str(formData, "date");
  const checkInTime = str(formData, "checkInTime");
  const checkOutTime = str(formData, "checkOutTime");
  const effectiveTutorId = f.substituteTutorId ?? f.tutorId;

  if (dateStr && checkInTime && effectiveTutorId) {
    const checkInAt = hk(dateStr, checkInTime);
    const startAt = f.startAt ?? hk(dateStr, "00:00");
    const payPercent =
      checkInAt.getTime() <= startAt.getTime() - 10 * 60 * 1000 ? 100 : 30;
    const user = await prisma.user.findUnique({
      where: { id: effectiveTutorId },
    });
    const rate = user?.perLessonRate ? Number(user.perLessonRate) : 0;
    const payAmount = (rate * payPercent) / 100;
    const checkOutAt = checkOutTime ? hk(dateStr, checkOutTime) : undefined;

    await prisma.checkIn.upsert({
      where: { lessonId_tutorId: { lessonId, tutorId: effectiveTutorId } },
      update: { checkInAt, payPercent, payAmount, ...(checkOutAt ? { checkOutAt } : {}) },
      create: {
        lessonId,
        tutorId: effectiveTutorId,
        checkInAt,
        checkOutAt: checkOutAt ?? null,
        payPercent,
        payAmount,
      },
    });
  }

  revalidatePath(`/admin/courses/${courseId}/lessons`);
  redirect(`/admin/courses/${courseId}/lessons`);
}

export async function setLessonStatus(
  lessonId: string,
  courseId: string,
  status: LessonStatus
) {
  await prisma.lesson.update({ where: { id: lessonId }, data: { status } });
  revalidatePath(`/admin/courses/${courseId}/lessons`);
}

export async function deleteLesson(lessonId: string, courseId: string) {
  await prisma.lesson.delete({ where: { id: lessonId } });
  revalidatePath(`/admin/courses/${courseId}/lessons`);
}

// 按小組時間表，於課程開始～結束日期之間批量產生課堂（略過已存在的日期）
export async function generateLessons(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { groups: true },
  });
  if (!course || !course.startDate || !course.endDate) return;

  const existing = await prisma.lesson.findMany({
    where: { group: { courseId } },
    select: { groupId: true, date: true },
  });
  const seen = new Set(
    existing.map((l) => `${l.groupId}|${l.date.toISOString().slice(0, 10)}`)
  );

  const start = new Date(course.startDate);
  const end = new Date(course.endDate);
  const toCreate: {
    groupId: string;
    date: Date;
    startAt: Date;
    endAt: Date;
  }[] = [];

  for (const g of course.groups) {
    if (g.daysOfWeek.length === 0 || !g.startTime || !g.endTime) continue;
    // 1..6 -> 1..6, 7(日) -> 0
    const targetDays = new Set(g.daysOfWeek.map((dw) => dw % 7));
    for (
      let d = new Date(start);
      d <= end;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      if (!targetDays.has(d.getUTCDay())) continue;
      const dateStr = d.toISOString().slice(0, 10);
      if (seen.has(`${g.id}|${dateStr}`)) continue;
      toCreate.push({
        groupId: g.id,
        date: dateOnly(dateStr),
        startAt: hk(dateStr, g.startTime),
        endAt: hk(dateStr, g.endTime),
      });
    }
  }

  if (toCreate.length > 0) {
    await prisma.lesson.createMany({ data: toCreate });
  }
  revalidatePath(`/admin/courses/${courseId}/lessons`);
}
