// 為今天加入一堂（指派給 陳老師）以便測試打卡。用法: node --env-file=.env scripts/add-today-lesson.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const chan = await prisma.user.findUnique({
    where: { email: "chan@cms.local" },
  });
  const group = await prisma.group.findFirst({
    where: { course: { name: { contains: "STEM" } } },
    orderBy: { name: "asc" },
  });
  if (!chan || !group) {
    console.log("找不到 陳老師 或 STEM 小組");
    return;
  }

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Hong_Kong",
  });
  const date = new Date(`${today}T00:00:00.000Z`);

  const existing = await prisma.lesson.findFirst({
    where: { groupId: group.id, date },
  });
  if (existing) {
    console.log(`今天 (${today}) 已有課堂，略過`);
    return;
  }

  await prisma.lesson.create({
    data: {
      groupId: group.id,
      date,
      startAt: new Date(`${today}T09:20:00+08:00`),
      endAt: new Date(`${today}T10:20:00+08:00`),
      tutorId: chan.id,
      tutorFee: 500,
    },
  });
  console.log(`已為 ${today} 加入一堂（${group.name}，導師 陳老師）`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
