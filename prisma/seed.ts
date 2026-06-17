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
const TODAY = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong" });
const todayMs = dateOnly(TODAY).getTime();

function minus15(t: string) {
  const [h, m] = t.split(":").map(Number);
  const tot = h * 60 + m - 15;
  return `${String(Math.floor(tot / 60)).padStart(2, "0")}:${String(tot % 60).padStart(2, "0")}`;
}

// 某年某月某星期的所有日期
function datesOfWeekday(year: number, month1: number, weekday: number): string[] {
  const res: string[] = [];
  const target = weekday % 7;
  const d = new Date(Date.UTC(year, month1 - 1, 1));
  while (d.getUTCMonth() === month1 - 1) {
    if (d.getUTCDay() === target) res.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return res;
}

const SURNAMES = ["陳","黃","李","張","林","何","劉","蔡","楊","吳","鄭","王","馮","趙","周","徐","孫","朱","胡","郭","羅","高","梁","謝","唐","許","鄧","蕭","曾","彭"];
const GIVEN = ["大文","小明","美儀","偉強","嘉欣","俊傑","志明","詠詩","家豪","凱琳","建華","曉彤","國強","婉婷","浩然","淑芬","子聰","麗珊","俊宇","欣怡","世傑","佩雯","承恩","雅文","卓賢","思敏","展鵬","若男","健朗","綺琪"];
const SCHOOL_BASE = ["聖瑪利","中華基督教","真道","樂善堂","仁濟","保良局","東華三院","培正","九龍真光","鄉議局","陽光","啟新","培英","德望","嘉諾撒","聖公會","金巴崙","宣道會","靈糧","崇真","閩僑","鮮魚行","農圃道","獻主會","瑪利諾","喇沙","拔萃","英華","華仁","聖保羅"];
const SCHOOL_SUFFIX = ["幼稚園", "小學", "中學"];
const COURSE_NAMES = ["STEM 編程班","奧數啟蒙班","英語拼音班","畫畫興趣班","籃球訓練班","Hip-Hop 舞蹈班","普通話正音班","小小科學家","機械人工程班","圍棋班","書法班","小提琴班","劍橋英語班","中華文化班","戲劇班","羽毛球班","K-POP 舞蹈班","珠心算班","乒乓球班","遊戲程式設計"];
const REGIONS = ["中西區","灣仔區","東區","南區","油尖旺區","深水埗區","九龍城區","黃大仙區","觀塘區","葵青區","荃灣區","屯門區","元朗區","北區","大埔區","沙田區","西貢區","離島區"];
const SUBJECTS = ["普通話、STEM","英語、拼音","畫畫、手工","籃球、體能","舞蹈、芭蕾","編程、機械人","奧數、珠心算","書法、國畫","戲劇、朗誦","音樂、小提琴"];
const GRADES_POOL = [
  ["幼稚園 K2", "幼稚園 K3"],
  ["小學一年級", "小學二年級", "小學三年級"],
  ["小學四年級", "小學五年級", "小學六年級"],
  ["中學一年級", "中學二年級"],
];
const STATUSES: CourseStatus[] = ["PLANNED", "CONFIRMED", "ONGOING", "ONGOING", "COMPLETED"];
const PREP: PrepStatus[] = ["NONE", "IN_PROGRESS", "DONE"];
const MAT: MaterialPrepStatus[] = ["NO_CONTENT", "NO_MATERIAL", "NOT_SENT_SCHOOL", "DONE"];
const TPREP: TutorPrepStatus[] = ["NOT_SENT", "SENT", "CONFIRMED"];
const TIMES = [["09:20", "10:20"], ["10:30", "11:30"], ["14:00", "15:00"], ["15:30", "16:30"], ["16:30", "18:00"]];

const SIG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.create({
    data: { email: "admin@cms.local", passwordHash, name: "管理員", role: "ADMIN" },
  });

  const yearDefs = [
    { label: "2023-2024", year: 2023, month: 11, sort: 0 },
    { label: "2024-2025", year: 2024, month: 11, sort: 1 },
    { label: "2025-2026", year: 2026, month: 6, sort: 2 }, // 當前學年，含今天
  ];

  let counter = 0; // 全域唯一計數（電郵 / 電話 / 名稱索引）
  let lessonTotal = 0;

  for (let yi = 0; yi < yearDefs.length; yi++) {
    const yd = yearDefs[yi];
    const academicYear = await prisma.academicYear.create({
      data: { label: yd.label, sortOrder: yd.sort },
    });
    const isCurrent = yi === yearDefs.length - 1;

    for (let i = 0; i < 10; i++, counter++) {
      const idx = counter % 30;

      // 導師
      const known = isCurrent && i === 0; // 保留 chan 作示範登入
      const tutor = await prisma.user.create({
        data: {
          email: known ? "chan@cms.local" : `tutor${counter}@cms.local`,
          passwordHash,
          name: known ? "陳大文" : `${SURNAMES[idx]}${GIVEN[idx]}`,
          phone: known ? "91234567" : `9${String(2000000 + counter).padStart(7, "0")}`,
          role: "TUTOR",
          perLessonRate: 400 + (counter % 6) * 30,
          region: REGIONS[counter % REGIONS.length],
          subjects: SUBJECTS[counter % SUBJECTS.length],
          tutorNo: String(1000 + counter),
          payeeName: known ? "陳大文" : `${SURNAMES[idx]}${GIVEN[idx]}`,
          bankCode: ["004", "024", "003", "012"][counter % 4],
          bankAccount: String(100000000 + counter * 137),
          gender: counter % 2 === 0 ? "F" : "M",
          education: "大學畢業",
          dseResult: JSON.stringify({ 中文: "5", 英文: "5*", 數學: "5" }),
        },
      });

      // 學校（每年 10 間不同）
      const sIdx = yi * 10 + i;
      const school = await prisma.school.create({
        data: {
          name: `${SCHOOL_BASE[sIdx % 30]}${SCHOOL_SUFFIX[sIdx % 3]}`,
          address: `${REGIONS[sIdx % REGIONS.length]}某某道 ${sIdx + 1} 號`,
          phone: `2${String(3000000 + sIdx).padStart(7, "0")}`,
          contactPerson: "校方負責人",
          // 第一間（當前學年）設打卡範圍以供示範
          ...(isCurrent && i === 0
            ? { latitude: 22.3193, longitude: 114.1694, checkInRadius: 300 }
            : {}),
        },
      });

      // 課程
      const course = await prisma.course.create({
        data: {
          academicYearId: academicYear.id,
          schoolId: school.id,
          name: COURSE_NAMES[counter % COURSE_NAMES.length],
          status: STATUSES[i % STATUSES.length],
          invoiceStatus: i % 3 === 0 ? "COMPLETE" : "INCOMPLETE",
          teachingLanguage: "粵語",
          workPlanNote: i % 4 === 0 ? "本期需要 8 堂；需要準備：教材、筆記" : null,
          startDate: dateOnly(`${yd.year}-${String(yd.month).padStart(2, "0")}-01`),
          endDate: dateOnly(`${yd.year}-${String(yd.month).padStart(2, "0")}-28`),
        },
      });

      // 小組
      const weekday = (i % 5) + 1; // 一至五
      const [start, end] = TIMES[i % TIMES.length];
      const group = await prisma.group.create({
        data: {
          courseId: course.id,
          name: "A組",
          studentGrades: GRADES_POOL[i % GRADES_POOL.length],
          studentCount: 8 + (i % 6),
          classLocation: "課室",
          daysOfWeek: [weekday],
          startTime: start,
          endTime: end,
        },
      });

      // 課堂（取該月該星期首 4 堂）
      const dates = datesOfWeekday(yd.year, yd.month, weekday).slice(0, 4);
      const lessonIds: string[] = [];
      for (let li = 0; li < dates.length; li++, lessonTotal++) {
        const d = dates[li];
        const past = dateOnly(d).getTime() < todayMs;
        const vacant = li === dates.length - 1 && i % 2 === 1; // 部分課堂空缺
        const tutorId = vacant ? null : tutor.id;
        const lesson = await prisma.lesson.create({
          data: {
            groupId: group.id,
            date: dateOnly(d),
            startAt: hk(d, start),
            endAt: hk(d, end),
            tutorId,
            tutorFee: tutorId ? Number(tutor.perLessonRate) : null,
            coursePrepStatus: (past ? "DONE" : PREP[li % PREP.length]) as PrepStatus,
            materialStatus: (past ? "DONE" : MAT[li % MAT.length]) as MaterialPrepStatus,
            tutorPrepStatus: TPREP[li % TPREP.length] as TutorPrepStatus,
          },
        });
        lessonIds.push(lesson.id);

        // 過去課堂：打卡紀錄（供糧單 / 我的紀錄）
        if (past && tutorId) {
          const early = li % 2 === 0;
          const pct = early ? 100 : 30;
          await prisma.checkIn.create({
            data: {
              lessonId: lesson.id,
              tutorId,
              checkInAt: hk(d, early ? minus15(start) : start),
              checkOutAt: hk(d, end),
              latitude: 22.3193,
              longitude: 114.1694,
              payPercent: pct,
              payAmount: (Number(tutor.perLessonRate) * pct) / 100,
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

      // 工作確認書（每隔幾個課程一張，部分已簽署）
      if (i % 3 === 0) {
        await prisma.jobConfirmation.create({
          data: {
            tutorId: tutor.id,
            courseId: course.id,
            title: `${course.name} 導師工作確認書`,
            position: "導師",
            tutorFee: Number(tutor.perLessonRate),
            status: i % 6 === 0 ? "SIGNED" : "PENDING",
            agreed: i % 6 === 0,
            signedAt: i % 6 === 0 ? new Date() : null,
            signatureData: i % 6 === 0 ? SIG : null,
            lessons: { connect: lessonIds.slice(0, 3).map((id) => ({ id })) },
          },
        });
      }
    }
  }

  console.log(`Seed 完成：3 學年 × 10（學校 / 課程 / 導師），共 ${lessonTotal} 堂。`);
  console.log("  管理員  admin@cms.local / password123");
  console.log("  導師示範登入：電話 91234567（陳大文，2025-2026 學年）");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
