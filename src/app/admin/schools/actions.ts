"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function read(formData: FormData) {
  const str = (k: string) => {
    const v = formData.get(k);
    const s = typeof v === "string" ? v.trim() : "";
    return s === "" ? null : s;
  };
  const num = (k: string) => {
    const s = str(k);
    if (s === null) return null;
    const n = Number(s);
    return Number.isNaN(n) ? null : n;
  };
  return {
    name: str("name") ?? "",
    address: str("address"),
    phone: str("phone"),
    fax: str("fax"),
    contactPerson: str("contactPerson"),
    contactPhone: str("contactPhone"),
    contactEmail: str("contactEmail"),
    notes: str("notes"),
    latitude: num("latitude"),
    longitude: num("longitude"),
    checkInRadius: num("checkInRadius"),
  };
}

export async function createSchool(formData: FormData) {
  const data = read(formData);
  if (!data.name) return;
  await prisma.school.create({ data });
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateSchool(id: string, formData: FormData) {
  const data = read(formData);
  if (!data.name) return;
  await prisma.school.update({ where: { id }, data });
  revalidatePath("/admin");
  redirect("/admin");
}
