// 為 2026 年 7 月及 8 月建立示範資料：每月 10 間學校，每間 1 個課程（共 20 校 / 20 課程）。
// 課程掛在學年 2025-2026（香港學年涵蓋至 8 月）。可重複執行：同名學校會略過。
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const YEAR_LABEL = "2025-2026";

const SCHOOL_BASES = [
  "啟新", "樂賢", "匯知", "德萃", "保良局",
  "東華三院", "聖公會", "循道衛理", "協恩", "瑪利曼",
];
const KIND = ["小學", "中學", "幼稚園", "書院", "學校"];

const COURSE_NAMES = [
  "英文拼音班", "奧數精英班", "STEM 機械人", "中文寫作", "普通話會話",
  "繪畫創作", "鋼琴基礎", "編程入門", "科學探索", "演講與辯論",
];

function dateOnly(s) {
  return new Date(`${s}T00:00:00.000Z`);
}

async function seedMonth(year, monthIdx /* 1-based */, tag, academicYearId) {
  const mm = String(monthIdx).padStart(2, "0");
  const lastDay = new Date(Date.UTC(year, monthIdx, 0)).getUTCDate();
  let createdSchools = 0;
  let createdCourses = 0;

  for (let i = 0; i < 10; i++) {
    const schoolName = `${SCHOOL_BASES[i]}${KIND[i % KIND.length]} (${tag})`;

    const existing = await prisma.school.findFirst({
      where: { name: schoolName },
      select: { id: true },
    });
    let schoolId = existing?.id;
    if (!schoolId) {
      const s = await prisma.school.create({
        data: {
          name: schoolName,
          address: `香港示範地址 ${mm}-${String(i + 1).padStart(2, "0")} 號`,
          phone: `2${mm}${String(1000 + i).slice(-4)}`,
          contactPerson: `${SCHOOL_BASES[i]} 主任`,
          contactPhone: `9${mm}${String(2000 + i).slice(-4)}`,
        },
      });
      schoolId = s.id;
      createdSchools++;
    }

    // 每間學校 1 個課程；開課日落在該月，結束於月底
    const startDay = String(Math.min(1 + i * 2, lastDay)).padStart(2, "0");
    const courseName = `${COURSE_NAMES[i]} (${tag})`;
    const dupCourse = await prisma.course.findFirst({
      where: { academicYearId, schoolId, name: courseName },
      select: { id: true },
    });
    if (!dupCourse) {
      await prisma.course.create({
        data: {
          academicYearId,
          schoolId,
          name: courseName,
          status: "CONFIRMED",
          teachingLanguage: i % 2 === 0 ? "廣東話" : "英語",
          startDate: dateOnly(`${year}-${mm}-${startDay}`),
          endDate: dateOnly(`${year}-${mm}-${String(lastDay).padStart(2, "0")}`),
          notes: `${tag} 示範課程`,
        },
      });
      createdCourses++;
    }
  }
  console.log(`  ${tag}: 新增學校 ${createdSchools} 間、課程 ${createdCourses} 個`);
}

async function main() {
  const year = await prisma.academicYear.findUnique({
    where: { label: YEAR_LABEL },
    select: { id: true },
  });
  if (!year) throw new Error(`找不到學年 ${YEAR_LABEL}`);

  console.log(`建立 2026 年 7 月 / 8 月示範資料（學年 ${YEAR_LABEL}）：`);
  await seedMonth(2026, 7, "7月示範", year.id);
  await seedMonth(2026, 8, "8月示範", year.id);

  const [schools, courses] = await Promise.all([
    prisma.school.count(),
    prisma.course.count(),
  ]);
  console.log(`完成。現有學校 ${schools} 間、課程 ${courses} 個。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
