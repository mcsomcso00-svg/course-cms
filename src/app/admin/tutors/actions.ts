"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
    isActive: formData.get("isActive") === "on",
  };
}

export async function createTutor(formData: FormData) {
  const data = tutorData(formData);
  if (!data.name) return;
  await prisma.user.create({ data: { ...data, role: "TUTOR" } });
  revalidatePath("/admin/tutors");
  redirect("/admin/tutors");
}

export async function updateTutor(id: string, formData: FormData) {
  const data = tutorData(formData);
  if (!data.name) return;
  await prisma.user.update({ where: { id }, data });
  revalidatePath("/admin/tutors");
  redirect("/admin/tutors");
}

export async function toggleTutorActive(id: string, isActive: boolean) {
  await prisma.user.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/tutors");
}
