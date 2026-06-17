// 驗證 pdf-lib 能嵌入 CJK 字型並輸出含中文的 PDF
const { PDFDocument, rgb } = require("pdf-lib");
const fontkitMod = require("@pdf-lib/fontkit");
const fs = require("fs");

async function main() {
  const fontBytes = fs.readFileSync("assets/NotoSansTC.otf");
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkitMod.default ?? fontkitMod);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const page = pdf.addPage([400, 200]);
  page.drawText("導師工作確認書 陳老師 STEM 編程班（A組）", {
    x: 20,
    y: 120,
    size: 14,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });
  const bytes = await pdf.save();
  fs.writeFileSync("assets/test.pdf", bytes);
  console.log("OK PDF bytes:", bytes.length);
}
main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
