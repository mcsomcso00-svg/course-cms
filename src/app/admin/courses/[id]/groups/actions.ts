"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function str(formData: FormData, k: string) {
  const v = formData.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

function int(formData: FormData, k: string) {
  const s = str(formData, k);
  const n = s ? parseInt(s, 10) : NaN;
  return Number.isNaN(n) ? null : n;
}

function groupData(formData: FormData) {
  return {
    name: str(formData, "name") ?? "",
    studentGrades: formData.getAll("studentGrades").map(String),
    studentCount: int(formData, "studentCount"),
    classLocation: str(formData, "classLocation"),
    materialLocation: str(formData, "materialLocation"),
    daysOfWeek: formData
      .getAll("daysOfWeek")
      .map((v) => parseInt(String(v), 10))
      .filter((n) => !Number.isNaN(n)),
    startTime: str(formData, "startTime"),
    endTime: str(formData, "endTime"),
    budget: str(formData, "budget"),
    requiresTA: formData.get("requiresTA") === "on",
    requiresAssistant: formData.get("requiresAssistant") === "on",
    notes: str(formData, "notes"),
  };
}

export async function createGroup(courseId: string, formData: FormData) {
  const data = groupData(formData);
  if (!data.name) return;
  await prisma.group.create({ data: { courseId, ...data } });
  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}`);
}

export async function updateGroup(
  groupId: string,
  courseId: string,
  formData: FormData
) {
  const data = groupData(formData);
  if (!data.name) return;
  await prisma.group.update({ where: { id: groupId }, data });
  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}`);
}

export async function deleteGroup(groupId: string, courseId: string) {
  await prisma.group.delete({ where: { id: groupId } });
  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}`);
}
