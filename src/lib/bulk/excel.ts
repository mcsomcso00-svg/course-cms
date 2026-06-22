import "server-only";
import ExcelJS from "exceljs";
import type { ImportSpec } from "./specs";
import { asStr } from "./specs";

function typeLabel(t?: string) {
  switch (t) {
    case "number":
    case "int":
      return "數字";
    case "date":
      return "日期 YYYY-MM-DD";
    case "enum":
      return "選項";
    default:
      return "文字";
  }
}

/** 產生某區段的 Excel 範本（含資料工作表 + 說明工作表）。 */
export async function buildTemplate(spec: ImportSpec): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "STARDIAN CMS";

  const ws = wb.addWorksheet(spec.sheetName);
  ws.columns = spec.columns.map((c) => ({
    header: c.required ? `${c.header} *` : c.header,
    key: c.key,
    width: Math.min(40, Math.max(12, c.header.length * 2.4 + 4)),
  }));
  const head = ws.getRow(1);
  head.font = { bold: true };
  head.alignment = { vertical: "middle" };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  spec.columns.forEach((c, i) => {
    const col = ws.getColumn(i + 1);
    // 文字 / 日期欄位設為文字格式，避免電話、身份證、日期被 Excel 自動轉換
    if (c.type !== "number" && c.type !== "int") col.numFmt = "@";
    if (c.type === "enum" && c.options?.length) {
      const formulae = [`"${c.options.map((o) => o.label).join(",")}"`];
      for (let r = 2; r <= 1000; r++) {
        ws.getCell(r, i + 1).dataValidation = {
          type: "list",
          allowBlank: true,
          formulae,
        };
      }
    }
  });

  // 說明工作表
  const info = wb.addWorksheet("說明");
  info.columns = [
    { header: "欄位", key: "h", width: 22 },
    { header: "必填", key: "req", width: 8 },
    { header: "類型", key: "t", width: 18 },
    { header: "說明 / 可選值", key: "n", width: 50 },
    { header: "範例", key: "e", width: 22 },
  ];
  info.getRow(1).font = { bold: true };
  info.addRow({
    h: spec.title,
    req: "",
    t: "",
    n: spec.description,
    e: "",
  });
  info.getRow(2).font = { italic: true };
  for (const c of spec.columns) {
    const optTxt =
      c.type === "enum" && c.options
        ? "可選：" + c.options.map((o) => o.label).join(" / ")
        : c.note ?? "";
    info.addRow({
      h: c.header,
      req: c.required ? "是" : "",
      t: typeLabel(c.type),
      n: optTxt,
      e: c.example ?? "",
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf as ArrayBuffer);
}

/** 解析上載的 Excel；回傳每列為 { 欄位key: 值 }，值保留 Date 或修剪後字串。 */
export async function parseUpload(
  spec: ImportSpec,
  buffer: Buffer
): Promise<{ rows: Record<string, unknown>[]; error?: string }> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  } catch {
    return { rows: [], error: "無法讀取檔案，請確認是 .xlsx 格式。" };
  }
  const ws =
    wb.worksheets.find((w) => w.name === spec.sheetName) ?? wb.worksheets[0];
  if (!ws) return { rows: [], error: "找不到工作表。" };

  // 標題列（第 1 列）→ 欄位 key（去掉必填標記 *）
  const headerToKey = new Map<string, string>();
  for (const c of spec.columns) {
    headerToKey.set(c.header.trim(), c.key);
    headerToKey.set(`${c.header} *`.trim(), c.key);
  }
  const colToKey = new Map<number, string>();
  ws.getRow(1).eachCell((cell, col) => {
    const h = asStr(cell.value).trim().replace(/\s*\*$/, "");
    const key = headerToKey.get(h) ?? headerToKey.get(`${h} *`);
    if (key) colToKey.set(col, key);
  });

  const present = new Set(colToKey.values());
  const missing = spec.columns
    .filter((c) => c.required && !present.has(c.key))
    .map((c) => c.header);
  if (missing.length) {
    return {
      rows: [],
      error: `範本缺少必填欄位：${missing.join("、")}。請使用「下載範本」的檔案。`,
    };
  }

  const rows: Record<string, unknown>[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const obj: Record<string, unknown> = {};
    let any = false;
    colToKey.forEach((key, col) => {
      const v = row.getCell(col).value;
      const sv = asStr(v);
      if (sv) any = true;
      obj[key] = v instanceof Date ? v : sv;
    });
    if (any) rows.push(obj);
  }
  return { rows };
}
