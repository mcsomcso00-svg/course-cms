import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Column, PreviewRow } from "./types";

// ===== 取值 / 轉換工具 =====

/** 將 exceljs 儲存格值（字串 / 數字 / 日期 / 富文字 / 公式）轉成乾淨字串。 */
export function asStr(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (o.result != null) return asStr(o.result);
    if (o.text != null) return String(o.text);
    if (Array.isArray(o.richText))
      return (o.richText as { text?: string }[]).map((r) => r.text ?? "").join("");
    if (o.hyperlink != null) return String(o.hyperlink);
    return "";
  }
  return String(v).trim();
}

/** 數字；空 → null；非法 → NaN。 */
function asNum(v: unknown): number | null {
  const t = asStr(v);
  if (!t) return null;
  const n = Number(t.replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

/** 日期（@db.Date，存 UTC 零時）；空 → null；非法 → "invalid"。 */
function asDate(v: unknown): Date | null | "invalid" {
  if (v == null || v === "") return null;
  if (v instanceof Date)
    return new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate()));
  const t = asStr(v);
  if (!t) return null;
  const m = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (!m) return "invalid";
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return Number.isNaN(d.getTime()) ? "invalid" : d;
}

/** enum：接受中文 label 或英文 value（忽略大小寫/空白）；空 → null；非法 → "invalid"。 */
function asEnum(
  v: unknown,
  opts: { value: string; label: string }[]
): string | null | "invalid" {
  const t = asStr(v);
  if (!t) return null;
  const norm = (s: string) => s.replace(/\s/g, "").toLowerCase();
  const hit = opts.find(
    (o) => norm(o.label) === norm(t) || norm(o.value) === norm(t)
  );
  return hit ? hit.value : "invalid";
}

function mkDisplay(columns: Column[], raw: Record<string, unknown>) {
  const d: Record<string, string> = {};
  for (const c of columns) d[c.key] = asStr(raw[c.key]);
  return d;
}

// 共用 enum 選項
const COURSE_STATUS = [
  { value: "PLANNED", label: "計劃中" },
  { value: "CONFIRMED", label: "已確認" },
  { value: "ONGOING", label: "進行中" },
  { value: "COMPLETED", label: "已完成" },
  { value: "CANCELLED", label: "已取消" },
];
const INVOICE_STATUS = [
  { value: "INCOMPLETE", label: "未完成" },
  { value: "COMPLETE", label: "已完成" },
];
const MATERIAL_STATUS = [
  { value: "NOT_PREPARED", label: "未準備" },
  { value: "IN_PROGRESS", label: "準備中" },
  { value: "PREPARED", label: "已準備" },
];

// ===== Spec 介面 =====

export interface ImportSpec {
  key: string;
  title: string;
  sheetName: string;
  description: string;
  columns: Column[];
  loadContext(): Promise<unknown>;
  buildRow(raw: Record<string, unknown>, rowNo: number, ctx: unknown): PreviewRow;
  commit(
    rows: PreviewRow[]
  ): Promise<{ created: number; updated: number; revalidate: string[] }>;
}

// 通過驗證、需寫入的列
function writable(rows: PreviewRow[]) {
  return rows.filter((r) => r.status !== "error" && r.data);
}

// ===================================================================
// 學校 Schools
// ===================================================================

const schoolsSpec: ImportSpec = {
  key: "schools",
  title: "學校",
  sheetName: "學校",
  description: "以「學校名稱」對應既有紀錄：已存在則更新，否則新增。",
  columns: [
    { key: "name", header: "學校名稱", required: true, example: "聖瑪利幼稚園" },
    { key: "address", header: "地址", example: "中西區某某道 1 號" },
    { key: "phone", header: "電話", type: "string", example: "25551234" },
    { key: "fax", header: "傳真", type: "string" },
    { key: "contactPerson", header: "學校負責人" },
    { key: "contactPhone", header: "負責人電話", type: "string" },
    { key: "contactEmail", header: "負責人電郵" },
    { key: "latitude", header: "緯度", type: "number", note: "打卡定位用，例 22.281" },
    { key: "longitude", header: "經度", type: "number", note: "例 114.158" },
    { key: "checkInRadius", header: "打卡範圍(米)", type: "int", example: "200" },
    { key: "notes", header: "備註" },
  ],
  async loadContext() {
    const schools = await prisma.school.findMany({ select: { id: true, name: true } });
    const byName = new Map<string, string>();
    for (const s of schools) byName.set(s.name.trim().toLowerCase(), s.id);
    return { byName };
  },
  buildRow(raw, rowNo, ctxU) {
    const ctx = ctxU as { byName: Map<string, string> };
    const messages: string[] = [];
    const display = mkDisplay(this.columns, raw);
    const name = asStr(raw.name);
    if (!name) messages.push("缺少學校名稱");

    const lat = asNum(raw.latitude);
    if (Number.isNaN(lat)) messages.push("緯度不是數字");
    const lng = asNum(raw.longitude);
    if (Number.isNaN(lng)) messages.push("經度不是數字");
    const radius = asNum(raw.checkInRadius);
    if (Number.isNaN(radius)) messages.push("打卡範圍不是數字");

    const matchId = name ? ctx.byName.get(name.toLowerCase()) ?? null : null;
    const status = messages.length ? "error" : matchId ? "update" : "new";
    const data = messages.length
      ? null
      : {
          name,
          address: asStr(raw.address) || null,
          phone: asStr(raw.phone) || null,
          fax: asStr(raw.fax) || null,
          contactPerson: asStr(raw.contactPerson) || null,
          contactPhone: asStr(raw.contactPhone) || null,
          contactEmail: asStr(raw.contactEmail) || null,
          notes: asStr(raw.notes) || null,
          latitude: lat,
          longitude: lng,
          checkInRadius: radius == null ? null : Math.round(radius),
        };
    return {
      rowNo,
      status,
      messages,
      display,
      data,
      matchId,
      dupKey: name ? `school:${name.toLowerCase()}` : null,
    };
  },
  async commit(rows) {
    let created = 0,
      updated = 0;
    await prisma.$transaction(async (tx) => {
      for (const r of writable(rows)) {
        const data = r.data as Prisma.SchoolUncheckedCreateInput;
        if (r.status === "update" && r.matchId) {
          await tx.school.update({ where: { id: r.matchId }, data });
          updated++;
        } else {
          await tx.school.create({ data });
          created++;
        }
      }
    });
    return { created, updated, revalidate: ["/admin"] };
  },
};

// ===================================================================
// 導師 Tutors（User role = TUTOR）
// ===================================================================

const tutorsSpec: ImportSpec = {
  key: "tutors",
  title: "導師",
  sheetName: "導師",
  description: "以「電話」對應既有導師：已存在則更新，否則新增；沒有電話則一律新增。",
  columns: [
    { key: "name", header: "導師姓名", required: true, example: "陳大文" },
    { key: "tutorNo", header: "編號", type: "string", example: "T001" },
    { key: "phone", header: "電話", type: "string", example: "91234567", note: "導師以此電話 OTP 登入；不可與其他用戶重複" },
    { key: "email", header: "電郵" },
    { key: "region", header: "地區", example: "九龍" },
    { key: "subjects", header: "任教科目", example: "數學、英文" },
    { key: "gender", header: "性別", note: "男 / 女" },
    { key: "perLessonRate", header: "每堂薪金(HKD)", type: "number", example: "300" },
    { key: "scrcExpiry", header: "SCRC到期", type: "date", example: "2027-01-31" },
    { key: "dseResult", header: "DSE成績" },
    { key: "education", header: "最高學歷" },
    { key: "experience", header: "經驗" },
    { key: "hkid", header: "身份證號碼", type: "string" },
    { key: "address", header: "地址" },
    { key: "dob", header: "出生日期", type: "date", example: "1998-05-20" },
    { key: "payeeName", header: "收款人名" },
    { key: "bankCode", header: "銀行編號", type: "string" },
    { key: "bankAccount", header: "銀行戶口", type: "string" },
    { key: "remarks", header: "評語" },
  ],
  async loadContext() {
    const users = await prisma.user.findMany({
      select: { id: true, phone: true, email: true, role: true },
    });
    const byPhone = new Map<string, { id: string; role: string }>();
    const byEmail = new Map<string, string>();
    for (const u of users) {
      if (u.phone) byPhone.set(u.phone.trim(), { id: u.id, role: u.role });
      if (u.email) byEmail.set(u.email.trim().toLowerCase(), u.id);
    }
    return { byPhone, byEmail };
  },
  buildRow(raw, rowNo, ctxU) {
    const ctx = ctxU as {
      byPhone: Map<string, { id: string; role: string }>;
      byEmail: Map<string, string>;
    };
    const messages: string[] = [];
    const display = mkDisplay(this.columns, raw);
    const name = asStr(raw.name);
    if (!name) messages.push("缺少導師姓名");

    const phone = asStr(raw.phone);
    const email = asStr(raw.email);
    const rate = asNum(raw.perLessonRate);
    if (Number.isNaN(rate)) messages.push("每堂薪金不是數字");
    const scrc = asDate(raw.scrcExpiry);
    if (scrc === "invalid") messages.push("SCRC到期日期格式錯誤（YYYY-MM-DD）");
    const dob = asDate(raw.dob);
    if (dob === "invalid") messages.push("出生日期格式錯誤（YYYY-MM-DD）");

    // 以電話對應既有導師
    let matchId: string | null = null;
    if (phone) {
      const hit = ctx.byPhone.get(phone);
      if (hit) {
        if (hit.role !== "TUTOR")
          messages.push("此電話已被非導師用戶（管理員）使用");
        else matchId = hit.id;
      }
    }
    if (email) {
      const eid = ctx.byEmail.get(email.toLowerCase());
      if (eid && eid !== matchId) messages.push("此電郵已被其他用戶使用");
    }

    const status = messages.length ? "error" : matchId ? "update" : "new";
    const data = messages.length
      ? null
      : {
          name,
          tutorNo: asStr(raw.tutorNo) || null,
          phone: phone || null,
          email: email || null,
          region: asStr(raw.region) || null,
          subjects: asStr(raw.subjects) || null,
          gender: asStr(raw.gender) || null,
          perLessonRate: rate,
          scrcExpiry: scrc === "invalid" ? null : scrc,
          dseResult: asStr(raw.dseResult) || null,
          education: asStr(raw.education) || null,
          experience: asStr(raw.experience) || null,
          hkid: asStr(raw.hkid) || null,
          address: asStr(raw.address) || null,
          dob: dob === "invalid" ? null : dob,
          payeeName: asStr(raw.payeeName) || null,
          bankCode: asStr(raw.bankCode) || null,
          bankAccount: asStr(raw.bankAccount) || null,
          remarks: asStr(raw.remarks) || null,
        };
    return {
      rowNo,
      status,
      messages,
      display,
      data,
      matchId,
      // 只有填了電話才在批次內去重（同名無電話可並存）
      dupKey: phone ? `tutor:${phone}` : null,
    };
  },
  async commit(rows) {
    let created = 0,
      updated = 0;
    await prisma.$transaction(async (tx) => {
      for (const r of writable(rows)) {
        const data = r.data as Prisma.UserUncheckedCreateInput;
        if (r.status === "update" && r.matchId) {
          await tx.user.update({ where: { id: r.matchId }, data });
          updated++;
        } else {
          await tx.user.create({
            data: { ...data, role: "TUTOR", isActive: true },
          });
          created++;
        }
      }
    });
    return { created, updated, revalidate: ["/admin/tutors"] };
  },
};

// ===================================================================
// 課程 Courses（以 學年 + 學校 名稱對應父層）
// ===================================================================

const coursesSpec: ImportSpec = {
  key: "courses",
  title: "課程",
  sheetName: "課程",
  description:
    "「學年」「學校」必須是系統已存在的名稱。以 學年+學校+課程名稱 對應既有課程：已存在則更新，否則新增。",
  columns: [
    { key: "academicYear", header: "學年", required: true, example: "2025-2026", note: "必須是系統已建立的學年標籤" },
    { key: "school", header: "學校", required: true, example: "聖瑪利幼稚園", note: "必須是系統已存在的學校名稱" },
    { key: "name", header: "課程名稱", required: true, example: "STEM 編程班" },
    { key: "code", header: "課程編號", type: "string" },
    { key: "status", header: "狀態", type: "enum", options: COURSE_STATUS, note: "預設「計劃中」" },
    { key: "teachingLanguage", header: "授課語言", example: "廣東話" },
    { key: "feeNote", header: "費用備註" },
    { key: "invoiceStatus", header: "發票狀態", type: "enum", options: INVOICE_STATUS, note: "預設「未完成」" },
    { key: "tutorYearsRequired", header: "導師年資要求" },
    { key: "tutorQualification", header: "導師資格要求" },
    { key: "tutorOtherRequirements", header: "導師其他要求" },
    { key: "contentRequirement", header: "內容要求" },
    { key: "materialRequirement", header: "物資要求" },
    { key: "startDate", header: "開始日期", type: "date", example: "2025-09-01" },
    { key: "endDate", header: "結束日期", type: "date", example: "2026-06-30" },
    { key: "notes", header: "備註" },
    { key: "workPlanNote", header: "工作計劃備註" },
  ],
  async loadContext() {
    const [years, schools, courses] = await Promise.all([
      prisma.academicYear.findMany({ select: { id: true, label: true } }),
      prisma.school.findMany({ select: { id: true, name: true } }),
      prisma.course.findMany({
        select: { id: true, name: true, schoolId: true, academicYearId: true },
      }),
    ]);
    const yearMap = new Map(years.map((y) => [y.label.trim().toLowerCase(), y.id]));
    const schoolMap = new Map(schools.map((s) => [s.name.trim().toLowerCase(), s.id]));
    const courseMap = new Map(
      courses.map((c) => [
        `${c.academicYearId}|${c.schoolId}|${c.name.trim().toLowerCase()}`,
        c.id,
      ])
    );
    return { yearMap, schoolMap, courseMap };
  },
  buildRow(raw, rowNo, ctxU) {
    const ctx = ctxU as {
      yearMap: Map<string, string>;
      schoolMap: Map<string, string>;
      courseMap: Map<string, string>;
    };
    const messages: string[] = [];
    const display = mkDisplay(this.columns, raw);

    const yLabel = asStr(raw.academicYear);
    const yId = yLabel ? ctx.yearMap.get(yLabel.toLowerCase()) ?? null : null;
    if (!yLabel) messages.push("缺少學年");
    else if (!yId) messages.push(`學年「${yLabel}」不存在，請先於系統建立`);

    const schName = asStr(raw.school);
    const schId = schName ? ctx.schoolMap.get(schName.toLowerCase()) ?? null : null;
    if (!schName) messages.push("缺少學校");
    else if (!schId) messages.push(`學校「${schName}」不存在，請先建立或一併匯入學校`);

    const name = asStr(raw.name);
    if (!name) messages.push("缺少課程名稱");

    const status = asEnum(raw.status, COURSE_STATUS);
    if (status === "invalid") messages.push("狀態不在可選值內");
    const invoice = asEnum(raw.invoiceStatus, INVOICE_STATUS);
    if (invoice === "invalid") messages.push("發票狀態不在可選值內");
    const sd = asDate(raw.startDate);
    if (sd === "invalid") messages.push("開始日期格式錯誤（YYYY-MM-DD）");
    const ed = asDate(raw.endDate);
    if (ed === "invalid") messages.push("結束日期格式錯誤（YYYY-MM-DD）");

    const key = yId && schId && name ? `${yId}|${schId}|${name.toLowerCase()}` : null;
    const matchId = key ? ctx.courseMap.get(key) ?? null : null;
    const ok = messages.length === 0;
    const data = ok
      ? {
          academicYearId: yId!,
          schoolId: schId!,
          name,
          code: asStr(raw.code) || null,
          status: (status ?? "PLANNED") as string,
          invoiceStatus: (invoice ?? "INCOMPLETE") as string,
          teachingLanguage: asStr(raw.teachingLanguage) || null,
          feeNote: asStr(raw.feeNote) || null,
          tutorYearsRequired: asStr(raw.tutorYearsRequired) || null,
          tutorQualification: asStr(raw.tutorQualification) || null,
          tutorOtherRequirements: asStr(raw.tutorOtherRequirements) || null,
          contentRequirement: asStr(raw.contentRequirement) || null,
          materialRequirement: asStr(raw.materialRequirement) || null,
          startDate: sd === "invalid" ? null : sd,
          endDate: ed === "invalid" ? null : ed,
          notes: asStr(raw.notes) || null,
          workPlanNote: asStr(raw.workPlanNote) || null,
        }
      : null;
    return {
      rowNo,
      status: ok ? (matchId ? "update" : "new") : "error",
      messages,
      display,
      data,
      matchId,
      dupKey: key ? `course:${key}` : null,
    };
  },
  async commit(rows) {
    let created = 0,
      updated = 0;
    await prisma.$transaction(async (tx) => {
      for (const r of writable(rows)) {
        const data = r.data as Prisma.CourseUncheckedCreateInput;
        if (r.status === "update" && r.matchId) {
          await tx.course.update({ where: { id: r.matchId }, data });
          updated++;
        } else {
          await tx.course.create({ data });
          created++;
        }
      }
    });
    return { created, updated, revalidate: ["/admin"] };
  },
};

// ===================================================================
// 課程物料 Materials（以 學年 + 學校 + 課程 對應課程）
// ===================================================================

const materialsSpec: ImportSpec = {
  key: "materials",
  title: "課程物料",
  sheetName: "課程物料",
  description:
    "「學年」「學校」「課程名稱」必須對應系統已存在的課程。以 課程+物料名稱 對應既有物料：已存在則更新，否則新增。",
  columns: [
    { key: "academicYear", header: "學年", required: true, example: "2025-2026" },
    { key: "school", header: "學校", required: true, example: "聖瑪利幼稚園" },
    { key: "course", header: "課程名稱", required: true, example: "STEM 編程班" },
    { key: "name", header: "物料名稱", required: true, example: "機械人套件" },
    { key: "quantity", header: "數量", type: "int", example: "10" },
    { key: "status", header: "狀態", type: "enum", options: MATERIAL_STATUS, note: "預設「未準備」" },
    { key: "notes", header: "備註" },
  ],
  async loadContext() {
    const [years, schools, courses, materials] = await Promise.all([
      prisma.academicYear.findMany({ select: { id: true, label: true } }),
      prisma.school.findMany({ select: { id: true, name: true } }),
      prisma.course.findMany({
        select: { id: true, name: true, schoolId: true, academicYearId: true },
      }),
      prisma.materialItem.findMany({ select: { id: true, name: true, courseId: true } }),
    ]);
    const yearMap = new Map(years.map((y) => [y.label.trim().toLowerCase(), y.id]));
    const schoolMap = new Map(schools.map((s) => [s.name.trim().toLowerCase(), s.id]));
    const courseMap = new Map(
      courses.map((c) => [
        `${c.academicYearId}|${c.schoolId}|${c.name.trim().toLowerCase()}`,
        c.id,
      ])
    );
    const materialMap = new Map(
      materials.map((m) => [`${m.courseId}|${m.name.trim().toLowerCase()}`, m.id])
    );
    return { yearMap, schoolMap, courseMap, materialMap };
  },
  buildRow(raw, rowNo, ctxU) {
    const ctx = ctxU as {
      yearMap: Map<string, string>;
      schoolMap: Map<string, string>;
      courseMap: Map<string, string>;
      materialMap: Map<string, string>;
    };
    const messages: string[] = [];
    const display = mkDisplay(this.columns, raw);

    const yLabel = asStr(raw.academicYear);
    const yId = yLabel ? ctx.yearMap.get(yLabel.toLowerCase()) ?? null : null;
    if (!yLabel) messages.push("缺少學年");
    else if (!yId) messages.push(`學年「${yLabel}」不存在`);

    const schName = asStr(raw.school);
    const schId = schName ? ctx.schoolMap.get(schName.toLowerCase()) ?? null : null;
    if (!schName) messages.push("缺少學校");
    else if (!schId) messages.push(`學校「${schName}」不存在`);

    const courseName = asStr(raw.course);
    let courseId: string | null = null;
    if (!courseName) messages.push("缺少課程名稱");
    else if (yId && schId) {
      courseId =
        ctx.courseMap.get(`${yId}|${schId}|${courseName.toLowerCase()}`) ?? null;
      if (!courseId) messages.push(`課程「${courseName}」在該學年/學校下不存在`);
    }

    const name = asStr(raw.name);
    if (!name) messages.push("缺少物料名稱");
    const qty = asNum(raw.quantity);
    if (Number.isNaN(qty)) messages.push("數量不是數字");
    const status = asEnum(raw.status, MATERIAL_STATUS);
    if (status === "invalid") messages.push("狀態不在可選值內");

    const matchId =
      courseId && name
        ? ctx.materialMap.get(`${courseId}|${name.toLowerCase()}`) ?? null
        : null;
    const ok = messages.length === 0;
    const data = ok
      ? {
          courseId: courseId!,
          name,
          quantity: qty == null ? null : Math.round(qty),
          status: (status ?? "NOT_PREPARED") as string,
          notes: asStr(raw.notes) || null,
        }
      : null;
    return {
      rowNo,
      status: ok ? (matchId ? "update" : "new") : "error",
      messages,
      display,
      data,
      matchId,
      dupKey: courseId && name ? `material:${courseId}|${name.toLowerCase()}` : null,
    };
  },
  async commit(rows) {
    let created = 0,
      updated = 0;
    await prisma.$transaction(async (tx) => {
      for (const r of writable(rows)) {
        const data = r.data as Prisma.MaterialItemUncheckedCreateInput;
        if (r.status === "update" && r.matchId) {
          await tx.materialItem.update({ where: { id: r.matchId }, data });
          updated++;
        } else {
          await tx.materialItem.create({ data });
          created++;
        }
      }
    });
    return { created, updated, revalidate: ["/admin"] };
  },
};

// ===================================================================

export const SPECS: Record<string, ImportSpec> = {
  schools: schoolsSpec,
  tutors: tutorsSpec,
  courses: coursesSpec,
  materials: materialsSpec,
};

export const SECTION_ORDER = ["schools", "tutors", "courses", "materials"];

export function getSpec(section: string): ImportSpec | null {
  return SPECS[section] ?? null;
}
