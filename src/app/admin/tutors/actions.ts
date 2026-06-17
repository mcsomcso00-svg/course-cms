"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function str(formData: FormData, k: string) {
  const v = formData.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

function date(formData: FormData, k: string) {
  const s = str(formData, k);
  return s ? new Date(`${s}T00:00:00.000Z`) : null;
}

function tutorData(formData: FormData) {
  const rateStr = str(formData, "perLessonRate");
  const rate = rateStr ? Number(rateStr) : null;
  return {
    name: str(formData, "name") ?? "",
    tutorNo: str(formData, "tutorNo"),
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    region: str(formData, "region"),
    subjects: str(formData, "subjects"),
    scrcExpiry: date(formData, "scrcExpiry"),
    dseResult: str(formData, "dseResult"),
    education: str(formData, "education"),
    experience: str(formData, "experience"),
    remarks: str(formData, "remarks"),
    gender: str(formData, "gender"),
    dob: date(formData, "dob"),
    hkid: str(formData, "hkid"),
    address: str(formData, "address"),
    payeeName: str(formData, "payeeName"),
    bankCode: str(formData, "bankCode"),
    bankAccount: str(formData, "bankAccount"),
    perLessonRate: rate !== null && !Number.isNaN(rate) ? rate : null,
  };
}

// 檢查電話是否已被其他用戶使用
async function phoneTaken(phone: string, exceptId?: string) {
  const dup = await prisma.user.findFirst({
    where: { phone, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  });
  return !!dup;
}

export async function createTutor(
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const data = tutorData(formData);
  if (!data.name) return "請輸入導師姓名。";
  if (data.phone && (await phoneTaken(data.phone))) {
    return "此電話號碼已被其他用戶使用，不可重複。";
  }
  await prisma.user.create({ data: { ...data, role: "TUTOR", isActive: true } });
  revalidatePath("/admin/tutors");
  redirect("/admin/tutors");
}

export async function updateTutor(
  id: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const data = tutorData(formData);
  if (!data.name) return "請輸入導師姓名。";
  if (data.phone && (await phoneTaken(data.phone, id))) {
    return "此電話號碼已被其他用戶使用，不可重複。";
  }
  await prisma.user.update({
    where: { id },
    data: { ...data, isActive: formData.get("isActive") === "on" },
  });
  revalidatePath("/admin/tutors");
  redirect("/admin/tutors");
}

export async function deleteTutor(id: string) {
  // 解除關聯後刪除：課堂設為空缺，打卡及工作確認書紀錄一併刪除
  const nullTutor: Prisma.LessonUncheckedUpdateManyInput = { tutorId: null };
  const nullSub: Prisma.LessonUncheckedUpdateManyInput = {
    substituteTutorId: null,
  };
  await prisma.lesson.updateMany({ where: { tutorId: id }, data: nullTutor });
  await prisma.lesson.updateMany({
    where: { substituteTutorId: id },
    data: nullSub,
  });
  await prisma.checkIn.deleteMany({ where: { tutorId: id } });
  await prisma.jobConfirmation.deleteMany({ where: { tutorId: id } });
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/tutors");
}
