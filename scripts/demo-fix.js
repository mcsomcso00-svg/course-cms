// 確認資料量，並確保示範導師 chan 今天有一堂可供打卡示範
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const counts = {
    學年: await prisma.academicYear.count(),
    學校: await prisma.school.count(),
    導師: await prisma.user.count({ where: { role: "TUTOR" } }),
    課程: await prisma.course.count(),
    課堂: await prisma.lesson.count(),
    打卡: await prisma.checkIn.count(),
    工作確認書: await prisma.jobConfirmation.count(),
  };
  console.log("COUNTS", JSON.stringify(counts));

  const chan = await prisma.user.findUnique({ where: { email: "chan@cms.local" } });
  if (!chan) {
    console.log("找不到 chan");
    return;
  }
  const lesson = await prisma.lesson.findFirst({
    where: { tutorId: chan.id },
    select: { groupId: true },
  });
  if (!lesson) {
    console.log("chan 沒有課堂");
    return;
  }
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong" });
  const date = new Date(`${today}T00:00:00.000Z`);
  const exists = await prisma.lesson.findFirst({
    where: { groupId: lesson.groupId, date },
  });
  if (exists) {
    console.log(`chan 今天 (${today}) 已有課堂`);
    return;
  }
  await prisma.lesson.create({
    data: {
      groupId: lesson.groupId,
      date,
      startAt: new Date(`${today}T09:20:00+08:00`),
      endAt: new Date(`${today}T10:20:00+08:00`),
      tutorId: chan.id,
      tutorFee: chan.perLessonRate ?? 500,
    },
  });
  console.log(`已為 chan 加入今天 (${today}) 一堂供打卡示範`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
