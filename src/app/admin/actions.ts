"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

// 新增學年：以開始年份計算，例如 2026 → "2026-2027"
export async function createAcademicYear(formData: FormData) {
  const sy = String(formData.get("startYear") ?? "").trim();
  if (!/^\d{4}$/.test(sy)) return;
  const start = parseInt(sy, 10);
  const label = `${start}-${start + 1}`;

  const existing = await prisma.academicYear.findUnique({ where: { label } });
  if (!existing) {
    const max = await prisma.academicYear.aggregate({
      _max: { sortOrder: true },
    });
    await prisma.academicYear.create({
      data: { label, sortOrder: (max._max.sortOrder ?? 0) + 1 },
    });
  }
  revalidatePath("/admin");
  redirect(`/admin?year=${label}`);
}

export async function hideYear(id: string) {
  await prisma.academicYear.update({ where: { id }, data: { isHidden: true } });
  revalidatePath("/admin");
  redirect("/admin");
}

export async function unhideYear(id: string) {
  await prisma.academicYear.update({ where: { id }, data: { isHidden: false } });
  revalidatePath("/admin");
}
