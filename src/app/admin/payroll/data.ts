import { prisma } from "@/lib/prisma";

export type PayrollCourse = {
  school: string;
  course: string;
  count: number;
  amount: number;
};

export type PayrollTutor = {
  tutorId: string;
  name: string;
  phone: string | null;
  tutorNo: string | null;
  payeeName: string | null;
  bankCode: string | null;
  bankAccount: string | null;
  courses: PayrollCourse[];
  subtotal: number;
};

export type Payroll = {
  month: string;
  tutors: PayrollTutor[];
  grandTotal: number;
  checkInCount: number;
};

export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(`${month}-01T00:00:00+08:00`);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  const end = new Date(
    `${ny}-${String(nm).padStart(2, "0")}-01T00:00:00+08:00`
  );
  return { start, end };
}

export async function getPayroll(month: string): Promise<Payroll> {
  const { start, end } = monthRange(month);

  const checkIns = await prisma.checkIn.findMany({
    where: { checkInAt: { gte: start, lt: end } },
    include: {
      tutor: true,
      lesson: {
        include: {
          group: { include: { course: { include: { school: true } } } },
        },
      },
    },
    orderBy: { checkInAt: "asc" },
  });

  const byTutor = new Map<
    string,
    {
      name: string;
      phone: string | null;
      tutorNo: string | null;
      payeeName: string | null;
      bankCode: string | null;
      bankAccount: string | null;
      courses: Map<string, PayrollCourse>;
      subtotal: number;
    }
  >();

  for (const ci of checkIns) {
    const amount = Number(ci.payAmount);
    const course = ci.lesson.group.course;
    if (!byTutor.has(ci.tutorId)) {
      byTutor.set(ci.tutorId, {
        name: ci.tutor.name,
        phone: ci.tutor.phone,
        tutorNo: ci.tutor.tutorNo,
        payeeName: ci.tutor.payeeName,
        bankCode: ci.tutor.bankCode,
        bankAccount: ci.tutor.bankAccount,
        courses: new Map(),
        subtotal: 0,
      });
    }
    const t = byTutor.get(ci.tutorId)!;
    if (!t.courses.has(course.id)) {
      t.courses.set(course.id, {
        school: course.school.name,
        course: course.name,
        count: 0,
        amount: 0,
      });
    }
    const c = t.courses.get(course.id)!;
    c.count += 1;
    c.amount += amount;
    t.subtotal += amount;
  }

  const tutors: PayrollTutor[] = Array.from(byTutor.entries())
    .map(([tutorId, t]) => ({
      tutorId,
      name: t.name,
      phone: t.phone,
      tutorNo: t.tutorNo,
      payeeName: t.payeeName,
      bankCode: t.bankCode,
      bankAccount: t.bankAccount,
      courses: Array.from(t.courses.values()),
      subtotal: t.subtotal,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const grandTotal = tutors.reduce((s, t) => s + t.subtotal, 0);

  return { month, tutors, grandTotal, checkInCount: checkIns.length };
}
