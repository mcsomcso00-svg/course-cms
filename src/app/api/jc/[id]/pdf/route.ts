import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import subsetFont from "subset-font";
import fs from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const WD = ["日", "一", "二", "三", "四", "五", "六"];
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

  // Variable, glyf-outline Noto Sans TC. We embed CJK fonts in two passes:
  // pass 1 collects every character drawn (laid out with the variable font's
  // metrics); we then use harfbuzz to instance it to a static weight and subset
  // to just those glyphs (no CFF, no variations) so pdf-lib's own subsetter can
  // build a correct, tiny Type0 cmap — which it cannot do for CFF/variable fonts.
  const fontBytes = await fs.readFile(
    path.join(process.cwd(), "assets", "NotoSansTC.ttf")
  );
  // Throwaway document just to get layout metrics in pass 1.
  const mdoc = await PDFDocument.create();
  mdoc.registerFontkit(fontkit);
  const metricFont = await mdoc.embedFont(fontBytes);

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const M = 42; // margin
  const W = 595;
  const H = 842;
  const CW = W - M * 2; // content width
  const ink = rgb(0.1, 0.1, 0.1);

  // ----- render state (shared by both passes) -----
  let DRAW = false; // pass 2 actually paints; pass 1 only measures + collects
  const used = new Set<string>();
  let curFont: PDFFont = metricFont; // metrics in pass 1, real font in pass 2
  let page: PDFPage; // only created in DRAW pass
  let y = H - M;
  let sigPng: Awaited<ReturnType<typeof pdf.embedPng>> | null = null;

  function text(s: string, x: number, yy: number, size: number) {
    for (const ch of s) used.add(ch);
    if (DRAW) page.drawText(s, { x, y: yy, size, font: curFont, color: ink });
  }
  function nl(h: number) {
    y -= h;
    if (y < M + 20) {
      if (DRAW) {
        page = pdf.addPage([W, H]);
      }
      y = H - M;
    }
  }
  function wrap(s: string, size: number, maxW: number): string[] {
    const lines: string[] = [];
    let cur = "";
    for (const ch of s) {
      if (ch === "\n") {
        lines.push(cur);
        cur = "";
        continue;
      }
      if (curFont.widthOfTextAtSize(cur + ch, size) > maxW && cur) {
        lines.push(cur);
        cur = ch;
      } else cur = cur + ch;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  // 段落（自動換行）
  function p(
    s: string,
    opts: { size?: number; x?: number; lh?: number } = {}
  ) {
    const size = opts.size ?? 8.5;
    const x = opts.x ?? M;
    const lh = opts.lh ?? size + 3.5;
    for (const ln of wrap(s, size, M + CW - x)) {
      text(ln, x, y, size);
      nl(lh);
    }
  }
  function center(s: string, size: number) {
    const w = curFont.widthOfTextAtSize(s, size);
    text(s, (W - w) / 2, y, size);
    nl(size + 4);
  }
  function rule() {
    if (DRAW)
      page.drawLine({
        start: { x: M, y: y + 4 },
        end: { x: M + CW, y: y + 4 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
  }

  // ----- data filled in from the JC -----
  const t = jc.tutor;
  const school = jc.course?.school;
  const ls = jc.lessons;
  const fee = jc.tutorFee != null ? Number(jc.tutorFee) : null;
  const dur =
    ls.length > 0
      ? (ls[0].endAt.getTime() - ls[0].startAt.getTime()) / 3600000
      : null;
  const hourly = fee != null && dur ? Math.round((fee / dur) * 10) / 10 : null;
  const schedule =
    ls.length > 0
      ? ls
          .map(
            (l) =>
              `${l.date.toISOString().slice(0, 10)}(${WD[l.date.getUTCDay()]}) ${hm(l.startAt)}-${hm(l.endAt)}`
          )
          .join("、")
      : "＿＿＿＿＿＿＿＿＿＿";
  const hkid4 = t.hkid ? t.hkid.replace(/\s/g, "").slice(0, 4) : "＿＿＿＿";
  const U = "＿＿＿＿＿＿";
  const courseName = jc.course?.name ?? U;
  const signedDate = jc.signedAt
    ? jc.signedAt.toLocaleDateString("zh-HK", { timeZone: "Asia/Hong_Kong" })
    : "2026 年 ＿ 月 ＿ 日";

  const colR = M + CW / 2 + 8;

  // The whole document, expressed once and run twice (measure, then draw).
  function content() {
    y = H - M;

    // ===== 標題 =====
    center("私人導師服務合約", 16);
    center("Private Tutor Service Agreement", 10);
    nl(8);
    p(`本服務合約由以下雙方於 2026 年 ＿ 月 ＿ 日共同訂立並共同遵守：`, {
      size: 8.5,
    });
    nl(2);

    // ===== 甲乙方 兩欄 =====
    const rowH = 14;
    const headerTop = y;
    const left = [
      `甲方 (家長/學生)：${U}`,
      `香港身份證 (首4位)：＿＿＿＿`,
      `聯絡電話 / 電郵：${U}`,
    ];
    const right = [
      `乙方 (導師)：${t.name}`,
      `香港身份證 (首4位)：${hkid4}`,
      `聯絡電話 / 電郵：${t.phone ?? U}`,
    ];
    for (let i = 0; i < 3; i++) {
      text(left[i], M, headerTop - i * rowH, 8.5);
      text(right[i], colR, headerTop - i * rowH, 8.5);
    }
    y = headerTop - 3 * rowH;
    nl(6);
    rule();
    nl(6);

    // ===== 條款 =====
    const ST = 9.5; // 標題字
    p("一、 服務對象、科目與地點", { size: ST });
    p(`受教學生：姓名 ${U}（年級：＿＿＿），與甲方關係為 ＿＿＿。`);
    p(
      `補習科目：${courseName}。　授課地點：${school?.name ?? U}${school?.address ? `（${school.address}）` : ""}。`
    );
    nl(3);

    p("二、 課時安排與堂費結算", { size: ST });
    p(`課時安排：每週授課 ＿ 次，每次 ${dur ?? "＿"} 小時。具體上課時間：`);
    p(schedule);
    p(
      `收費標準：每小時港幣 ${hourly ?? "＿＿"} 元正（即每堂費用為港幣 ${fee ?? "＿＿"} 元正）。`
    );
    p(`付款方式：[ ] 每堂即時付　[ ] 每月月底結算　[ ] 預付制（每 ＿ 堂預付港幣 ＿＿ 元）。`);
    p(`付款途徑：[ ] 現金　[ ] 銀行轉賬/轉數快 (FPS) 至賬戶/電話：${U}`);
    nl(3);

    p("三、 請假、遲到與補課機制", { size: ST });
    p("1. 常規請假：任何一方取消或更改課堂，必須至少在原定時間 24 小時前 通知對方。若甲方逾期通知或無故缺席，該堂仍須全額支付堂費；若乙方逾期或缺席，須於兩週內免費補回一堂。");
    p("2. 突發病假：因突發疾病未能上課，須於上課前至少 2 小時 通知，並於事後提供註冊醫生證明（病假紙）。");
    p("3. 遲到處理：導師遲到須於當日或日後補足時間；學生遲到則按原定時間結束，堂費不予扣減。");
    nl(3);

    p("四、 香港惡劣天氣安排", { size: ST });
    p("1. 當香港天文台發出八號或以上熱帶氣旋警告、或黑色暴雨警告時，當日實體面授課自動取消，雙方應另約時間補課，甲方無需就該取消課堂繳費（或雙方同意即時改為網上授課）。");
    p("2. 若上述信號於上課前 2 小時 或更早時間除下且交通恢復，課堂應照常進行（雙方另有約定除外）。");
    nl(3);

    p("五、 合約期限、提早終止與私隱保密", { size: ST });
    p("1. 期限與終止：本合約自簽署日起生效。任何一方欲提早解除合約，須提前 7 天 以書面（含WhatsApp/微信）通知對方。若有嚴重違約或不當言行，另一方有權即時終止合約。");
    p("2. 私隱保密：雙方承諾嚴格遵守香港法例第486章《個人資料（私隱）條例》，本合約涉及的身份證、住址及電話等個人資料僅用於本服務，未經同意授權不得向任何第三方披露。");
    p("3. 法律管轄：本合約的訂立、解釋與爭議解決均受香港特別行政區法律管轄。");
    nl(2);
    p("法律聲明 (Disclaimer)：本合約為私人服務協議，旨在明確教學約定。本協議並不構成香港法例第57章《僱傭條例》下的正式僱傭關係，乙方（導師）是以獨立承辦商/自僱人士身份提供專業教學服務。", { size: 7.5 });
    nl(8);
    rule();
    nl(10);

    // ===== 簽署欄 =====
    const sigTop = y;
    text("甲方 (家長/學生) 簽署：", M, sigTop, 8.5);
    text("姓名 (正楷)：＿＿＿＿＿＿", M, sigTop - 28, 8.5);
    text("日期：2026 年 ＿ 月 ＿ 日", M, sigTop - 44, 8.5);

    text("乙方 (導師) 簽署：", colR, sigTop, 8.5);
    if (DRAW && sigPng) {
      page.drawImage(sigPng, { x: colR, y: sigTop - 30, width: 110, height: 34 });
    }
    text(`姓名 (正楷)：${t.name}`, colR, sigTop - 40, 8.5);
    text(`日期：${signedDate}`, colR, sigTop - 56, 8.5);
  }

  // Pass 1: measure + collect characters (no drawing).
  DRAW = false;
  content();

  // Build the exact static subset and switch fonts for the real pass.
  const staticSubset = await subsetFont(fontBytes, [...used].join(""), {
    targetFormat: "truetype",
    variationAxes: { wght: 400 },
  });
  const font = await pdf.embedFont(staticSubset, { subset: true });

  // Embed signature image once (used in pass 2 only).
  if (jc.signatureData?.startsWith("data:image")) {
    try {
      sigPng = await pdf.embedPng(
        Buffer.from(jc.signatureData.split(",")[1], "base64")
      );
    } catch {
      /* 略過無效簽名 */
    }
  }

  // Pass 2: draw for real.
  DRAW = true;
  curFont = font;
  page = pdf.addPage([W, H]);
  content();

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="contract-${id}.pdf"`,
    },
  });
}
