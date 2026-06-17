"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function str(formData: FormData, k: string) {
  const v = formData.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

export async function createAdmin(formData: FormData) {
  const name = str(formData, "name");
  const email = str(formData, "email");
  const password = str(formData, "password");
  if (!name || !email || !password) return;

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "ADMIN",
    },
  });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateAdmin(id: string, formData: FormData) {
  const name = str(formData, "name");
  const email = str(formData, "email");
  const password = str(formData, "password");
  if (!name || !email) return;

  await prisma.user.update({
    where: { id },
    data: {
      name,
      email,
      isActive: formData.get("isActive") === "on",
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
  });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}
