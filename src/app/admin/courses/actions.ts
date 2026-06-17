"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CourseStatus, InvoiceStatus } from "@prisma/client";
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

export async function createCourse(
  schoolId: string,
  academicYearId: string,
  formData: FormData
) {
  const data = courseData(formData);
  if (!data.name) return;

  const course = await prisma.course.create({
    data: { schoolId, academicYearId, ...data },
  });
  revalidatePath("/admin");
  redirect(`/admin/courses/${course.id}`);
}

function courseData(formData: FormData) {
  return {
    name: str(formData, "name") ?? "",
    code: str(formData, "code"),
    status: (str(formData, "status") ?? "PLANNED") as CourseStatus,
    feeNote: str(formData, "feeNote"),
    invoiceStatus: (str(formData, "invoiceStatus") ?? "INCOMPLETE") as InvoiceStatus,
    startDate: date(formData, "startDate"),
    endDate: date(formData, "endDate"),
    tutorYearsRequired: str(formData, "tutorYearsRequired"),
    tutorQualification: str(formData, "tutorQualification"),
    tutorOtherRequirements: str(formData, "tutorOtherRequirements"),
    contentRequirement: str(formData, "contentRequirement"),
    materialRequirement: str(formData, "materialRequirement"),
    teachingLanguage: str(formData, "teachingLanguage"),
    notes: str(formData, "notes"),
    workPlanNote: str(formData, "workPlanNote"),
  };
}

export async function updateCourse(id: string, formData: FormData) {
  const data = courseData(formData);
  if (!data.name) return;
  await prisma.course.update({ where: { id }, data });
  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${id}`);
  redirect(`/admin/courses/${id}`);
}

export async function deleteCourse(id: string) {
  // JobConfirmation.course 無 cascade，先解除關聯；其餘（小組、課堂、物料）由 schema cascade 處理
  await prisma.jobConfirmation.updateMany({
    where: { courseId: id },
    data: { courseId: null },
  });
  await prisma.course.delete({ where: { id } });
  revalidatePath("/admin");
  redirect("/admin");
}

export async function duplicateCourse(id: string) {
  const src = await prisma.course.findUnique({
    where: { id },
    include: { groups: true },
  });
  if (!src) return;

  const copy = await prisma.course.create({
    data: {
      academicYearId: src.academicYearId,
      schoolId: src.schoolId,
      name: `${src.name}（副本）`,
      code: null,
      status: "PLANNED",
      feeNote: src.feeNote,
      invoiceStatus: "INCOMPLETE",
      startDate: src.startDate,
      endDate: src.endDate,
      tutorYearsRequired: src.tutorYearsRequired,
      tutorQualification: src.tutorQualification,
      tutorOtherRequirements: src.tutorOtherRequirements,
      contentRequirement: src.contentRequirement,
      materialRequirement: src.materialRequirement,
      teachingLanguage: src.teachingLanguage,
      notes: src.notes,
      workPlanNote: src.workPlanNote,
      // 複製小組（不含課堂），方便日後在課堂詳情批量產生
      groups: {
        create: src.groups.map((g) => ({
          name: g.name,
          studentGrades: g.studentGrades,
          studentCount: g.studentCount,
          classLocation: g.classLocation,
          materialLocation: g.materialLocation,
          daysOfWeek: g.daysOfWeek,
          startTime: g.startTime,
          endTime: g.endTime,
          budget: g.budget,
          requiresTA: g.requiresTA,
          requiresAssistant: g.requiresAssistant,
          notes: g.notes,
        })),
      },
    },
  });

  revalidatePath("/admin");
  redirect(`/admin/courses/${copy.id}`);
}
