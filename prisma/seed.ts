import {
  PrismaClient,
  type MaterialPrepStatus,
  type PrepStatus,
  type TutorPrepStatus,
  type CourseStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const dateOnly = (s: string) => new Date(`${s}T00:00:00.000Z`);
const hk = (s: string, t: string) => new Date(`${s}T${t}:00+08:00`);

// 今天（香港）
const TODAY = new Date().toLocaleDateString("en-CA", {
  timeZone: "Asia/Hong_Kong",
});
const todayMs = dateOnly(TODAY).getTime();

// 2026 年 6 月各星期的日期
const JUNE: Record<number, string[]> = {
  1: ["2026-06-01", "2026-06-08", "2026-06-15", "2026-06-22", "2026-06-29"], // 一
  2: ["2026-06-02", "2026-06-09", "2026-06-16", "2026-06-23", "2026-06-30"], // 二
  3: ["2026-06-03", "2026-06-10", "2026-06-17", "2026-06-24"], // 三（含今天 17 號）
  4: ["2026-06-04", "2026-06-11", "2026-06-18", "2026-06-25"], // 四
  5: ["2026-06-05", "2026-06-12", "2026-06-19", "2026-06-26"], // 五
};

const PREP: PrepStatus[] = ["NONE", "IN_PROGRESS", "DONE"];
const MAT: MaterialPrepStatus[] = [
  "NO_CONTENT",
  "NO_MATERIAL",
  "NOT_SENT_SCHOOL",
  "DONE",
];
const TPREP: TutorPrepStatus[] = ["NOT_SENT", "SENT", "CONFIRMED"];

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  // ===== 學年 =====
  const years: Record<string, string> = {};
  const labels = ["2023-2024", "2024-2025", "2025-2026"];
  for (let i = 0; i < labels.length; i++) {
    const yr = await prisma.academicYear.create({
      data: { label: labels[i], sortOrder: i },
    });
    years[labels[i]] = yr.id;
  }
  const curYear = years["2025-2026"];

  // ===== 管理員 =====
  await prisma.user.create({
    data: { email: "admin@cms.local", passwordHash, name: "管理員", role: "ADMIN" },
  });

  // ===== 導師（含完整檔案，可用電話 OTP 登入）=====
  const tutorSeed = [
    { email: "chan@cms.local", name: "陳大文", phone: "91234567", rate: 500, region: "九龍城區", subjects: "普通話、STEM", bankCode: "024", bankAccount: "123456789", tutorNo: "1001" },
    { email: "wong@cms.local", name: "黃小明", phone: "98765432", rate: 450, region: "沙田區", subjects: "英語、拼音", bankCode: "003", bankAccount: "234567890", tutorNo: "1002" },
    { email: "lee@cms.local", name: "李美儀", phone: "92345678", rate: 480, region: "中西區", subjects: "畫畫、手工", bankCode: "004", bankAccount: "345678901", tutorNo: "1003" },
    { email: "cheung@cms.local", name: "張偉強", phone: "93456789", rate: 520, region: "觀塘區", subjects: "籃球、體能", bankCode: "024", bankAccount: "456789012", tutorNo: "1004" },
    { email: "lam@cms.local", name: "林嘉欣", phone: "94567890", rate: 460, region: "元朗區", subjects: "舞蹈、芭蕾", bankCode: "012", bankAccount: "567890123", tutorNo: "1005" },
    { email: "ho@cms.local", name: "何俊傑", phone: "95678901", rate: 500, region: "深水埗區", subjects: "編程、機械人", bankCode: "004", bankAccount: "678901234", tutorNo: "1006" },
  ];
  const tutors: { id: string; rate: number; name: string }[] = [];
  for (const t of tutorSeed) {
    const u = await prisma.user.create({
      data: {
        email: t.email,
        passwordHash,
        name: t.name,
        phone: t.phone,
        role: "TUTOR",
        perLessonRate: t.rate,
        region: t.region,
        subjects: t.subjects,
        bankCode: t.bankCode,
        bankAccount: t.bankAccount,
        payeeName: t.name,
        tutorNo: t.tutorNo,
        gender: "F",
        education: "大學畢業",
        dseResult: JSON.stringify({ 中文: "5", 英文: "5*", 數學: "5" }),
      },
    });
    tutors.push({ id: u.id, rate: t.rate, name: t.name });
  }

  // ===== 學校（其一設定打卡範圍）=====
  const schools = await Promise.all([
    prisma.school.create({
      data: {
        name: "星願幼稚園",
        address: "九龍旺角彌敦道 100 號",
        phone: "23456789",
        contactPerson: "李主任",
        contactPhone: "61234567",
        // 打卡地理範圍（旺角附近）
        latitude: 22.3193,
        longitude: 114.1694,
        checkInRadius: 300,
      },
    }),
    prisma.school.create({
      data: { name: "友愛小學", address: "新界沙田正街 8 號", phone: "26781234", contactPerson: "陳老師" },
    }),
    prisma.school.create({
      data: { name: "仁愛小學", address: "香港中環皇后大道 50 號", phone: "25012345", contactPerson: "王主任" },
    }),
    prisma.school.create({
      data: { name: "培正中學", address: "九龍何文田培正道 20 號", phone: "27119876", contactPerson: "梁副校" },
    }),
  ]);

  // ===== 課程 + 小組 + 課堂 =====
  type CourseDef = {
    school: number;
    name: string;
    status: CourseStatus;
    days: number[];
    start: string;
    end: string;
    grades: string[];
    tutorIdx: number | null;
    note?: string;
    invoice?: "INCOMPLETE" | "COMPLETE";
  };
  const courseDefs: CourseDef[] = [
    { school: 0, name: "創意英語班", status: "ONGOING", days: [1], start: "09:20", end: "10:20", grades: ["幼稚園 K2", "幼稚園 K3"], tutorIdx: 1, invoice: "INCOMPLETE" },
    { school: 0, name: "奧數啟蒙班", status: "CONFIRMED", days: [3], start: "11:00", end: "12:00", grades: ["幼稚園 K3"], tutorIdx: 0, note: "本期需要 8 堂；需要準備：教材、工作紙" },
    { school: 1, name: "STEM 編程班（初級）", status: "ONGOING", days: [3], start: "09:20", end: "10:20", grades: ["小學一年級", "小學二年級", "小學三年級"], tutorIdx: 0, invoice: "COMPLETE", note: "micro:bit 套裝 ×10" },
    { school: 1, name: "籃球訓練班", status: "ONGOING", days: [5], start: "16:00", end: "17:30", grades: ["小學四年級", "小學五年級", "小學六年級"], tutorIdx: 3 },
    { school: 2, name: "畫畫興趣班", status: "ONGOING", days: [2], start: "15:00", end: "16:00", grades: ["小學一年級", "小學二年級"], tutorIdx: 2, invoice: "INCOMPLETE" },
    { school: 2, name: "Hip-Hop 舞蹈班", status: "PLANNED", days: [4], start: "16:30", end: "17:30", grades: ["小學三年級", "小學四年級"], tutorIdx: 4 },
    { school: 3, name: "機械人工程班", status: "ONGOING", days: [2], start: "14:00", end: "15:30", grades: ["中學一年級", "中學二年級"], tutorIdx: 5, note: "需要新教材（10 堂）" },
    { school: 3, name: "中文寫作班（暫缺導師）", status: "CONFIRMED", days: [4], start: "10:00", end: "11:00", grades: ["中學三年級"], tutorIdx: null },
  ];

  let li = 0;
  for (const c of courseDefs) {
    const course = await prisma.course.create({
      data: {
        academicYearId: curYear,
        schoolId: schools[c.school].id,
        name: c.name,
        status: c.status,
        invoiceStatus: c.invoice ?? "INCOMPLETE",
        teachingLanguage: "粵語",
        workPlanNote: c.note,
        startDate: dateOnly("2026-06-01"),
        endDate: dateOnly("2026-06-30"),
      },
    });
    const group = await prisma.group.create({
      data: {
        courseId: course.id,
        name: "A組",
        studentGrades: c.grades,
        studentCount: 10,
        classLocation: "課室",
        daysOfWeek: c.days,
        startTime: c.start,
        endTime: c.end,
      },
    });

    const dates = c.days.flatMap((d) => JUNE[d] ?? []).sort();
    const tutor = c.tutorIdx != null ? tutors[c.tutorIdx] : null;

    for (let i = 0; i < dates.length; i++, li++) {
      const d = dates[i];
      const isPast = dateOnly(d).getTime() < todayMs;
      // 製造狀態變化以展示彩色圓點 / 報表
      const vacant = tutor == null || (c.status === "ONGOING" && i === dates.length - 1);
      const tutorId = vacant ? null : tutor!.id;
      const lesson = await prisma.lesson.create({
        data: {
          groupId: group.id,
          date: dateOnly(d),
          startAt: hk(d, c.start),
          endAt: hk(d, c.end),
          tutorId,
          tutorFee: tutorId ? tutor!.rate : null,
          coursePrepStatus: (isPast ? "DONE" : PREP[i % PREP.length]) as PrepStatus,
          materialStatus: (isPast ? "DONE" : MAT[i % MAT.length]) as MaterialPrepStatus,
          tutorPrepStatus: TPREP[i % TPREP.length] as TutorPrepStatus,
        },
      });

      // 過去的課堂：建立打卡紀錄（供糧單 / 我的紀錄展示）
      if (isPast && tutorId && tutor) {
        const early = i % 2 === 0; // 交替 100% / 30%
        const payPercent = early ? 100 : 30;
        await prisma.checkIn.create({
          data: {
            lessonId: lesson.id,
            tutorId,
            checkInAt: hk(d, early ? minus10(c.start) : c.start),
            checkOutAt: hk(d, c.end),
            latitude: 22.3193,
            longitude: 114.1694,
            payPercent,
            payAmount: (tutor.rate * payPercent) / 100,
          },
        });
      }
    }

    // 物料
    await prisma.materialItem.createMany({
      data: [
        { courseId: course.id, name: "學生工作紙", quantity: 20, status: "PREPARED" },
        { courseId: course.id, name: "教材套裝", quantity: 10, status: "IN_PROGRESS" },
        { courseId: course.id, name: "證書", quantity: 20, status: "NOT_PREPARED" },
      ],
    });

    // 工作確認書：部分課程製作（含一張已簽署）
    if (tutor) {
      const someLessons = await prisma.lesson.findMany({
        where: { groupId: group.id },
        take: 3,
        select: { id: true },
      });
      await prisma.jobConfirmation.create({
        data: {
          tutorId: tutor.id,
          courseId: course.id,
          title: `${c.name} 導師工作確認書`,
          position: "導師",
          tutorFee: tutor.rate,
          status: c.school === 1 ? "SIGNED" : "PENDING",
          agreed: c.school === 1,
          signedAt: c.school === 1 ? new Date() : null,
          signatureData:
            c.school === 1
              ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
              : null,
          lessons: { connect: someLessons.map((l) => ({ id: l.id })) },
        },
      });
    }
  }

  console.log(`Seed 完成：${courseDefs.length} 課程、${li} 堂。`);
  console.log("  管理員  admin@cms.local / password123");
  console.log("  導師    chan@cms.local / password123（電話 91234567）等 6 位");
}

function minus10(t: string) {
  const [h, m] = t.split(":").map(Number);
  const total = h * 60 + m - 15;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
