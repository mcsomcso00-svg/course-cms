"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MaterialStatus } from "@prisma/client";
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

export async function createMaterial(courseId: string, formData: FormData) {
  const name = str(formData, "name");
  if (!name) return;
  await prisma.materialItem.create({
    data: {
      courseId,
      name,
      quantity: int(formData, "quantity"),
      notes: str(formData, "notes"),
    },
  });
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function updateMaterial(
  id: string,
  courseId: string,
  formData: FormData
) {
  const name = str(formData, "name");
  if (!name) return;
  await prisma.materialItem.update({
    where: { id },
    data: {
      name,
      quantity: int(formData, "quantity"),
      status: (str(formData, "status") ?? "NOT_PREPARED") as MaterialStatus,
      notes: str(formData, "notes"),
    },
  });
  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}`);
}

export async function setMaterialStatus(
  id: string,
  courseId: string,
  status: MaterialStatus
) {
  await prisma.materialItem.update({ where: { id }, data: { status } });
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function deleteMaterial(id: string, courseId: string) {
  await prisma.materialItem.delete({ where: { id } });
  revalidatePath(`/admin/courses/${courseId}`);
}
