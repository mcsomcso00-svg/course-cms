import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "node:fs/promises";
import path from "node:path";
import type { ConfirmationStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const STATUS_LABEL: Record<ConfirmationStatus, string> = {
  PENDING: "未簽署",
  SIGNED: "已簽署",
  CONFIRMED: "已確認",
  VOID: "停用",
};

function hm(d: Date) {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Hong_Kong",
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const jc = await prisma.jobConfirmation.findUnique({
    where: { id },
    include: {
      tutor: true,
      course: { include: { school: true } },
      lessons: { include: { group: true }, orderBy: { date: "asc" } },
    },
  });
  if (!jc) return new NextResponse("Not found", { status: 404 });
  if (session.user.role !== "ADMIN" && jc.tutorId !== session.user.id)
    return new NextResponse("Forbidden", { status: 403 });

  const fontBytes = await fs.readFile(
    path.join(process.cwd(), "assets", "NotoSansTC.otf")
  );
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });

  const page = pdf.addPage([595, 842]); // A4
  const { height } = page.getSize();
  let y = height - 60;
  const ink = rgb(0.1, 0.1, 0.1);
  const draw = (text: string, size = 12, indent = 50) => {
    page.drawText(text, { x: indent, y, size, font, color: ink });
    y -= size + 8;
  };

  draw("導師工作確認書", 20);
  y -= 6;
  draw(`學校：${jc.course?.school.name ?? "—"}`);
  draw(`課程：${jc.course?.name ?? jc.title}`);
  draw(`導師：${jc.tutor.name}（${jc.position ?? "導師"}）`);
  if (jc.tutorFee != null) draw(`導師費：HKD ${Number(jc.tutorFee)}`);
  y -= 4;
  draw("課堂：");
  for (const l of jc.lessons) {
    const ds = l.date.toISOString().slice(0, 10);
    draw(`  ${ds}（${l.group.name}） ${hm(l.startAt)}-${hm(l.endAt)}`, 11, 60);
  }
  if (jc.otherAgreement) {
    y -= 4;
    draw("其他協議：");
    draw(`  ${jc.otherAgreement}`, 11, 60);
  }
  y -= 8;
  draw(`狀態：${STATUS_LABEL[jc.status]}`);
  if (jc.agreed) draw("（已同意接任以上工作安排）", 11);
  if (jc.signedAt)
    draw(
      `簽署日期：${jc.signedAt.toLocaleString("zh-HK", {
        timeZone: "Asia/Hong_Kong",
      })}`
    );
  y -= 6;
  draw("導師簽署：");
  if (jc.signatureData?.startsWith("data:image")) {
    try {
      const b64 = jc.signatureData.split(",")[1];
      const png = await pdf.embedPng(Buffer.from(b64, "base64"));
      page.drawImage(png, { x: 60, y: y - 70, width: 160, height: 80 });
    } catch {
      /* 簽名圖片無效則略過 */
    }
  }

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="JC-${id}.pdf"`,
    },
  });
}
