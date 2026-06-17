import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { getPayroll } from "../data";

function csvCell(v: string | number) {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month") ?? "";
  const format = searchParams.get("format") ?? "csv";
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return new NextResponse("Bad month", { status: 400 });
  }

  const { tutors, grandTotal } = await getPayroll(month);
  const header = [
    "編號",
    "導師",
    "電話",
    "收款人名",
    "銀行編號",
    "銀行戶口",
    "學校",
    "課程",
    "堂數",
    "金額",
  ];

  if (format === "xlsx") {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`糧單 ${month}`);
    ws.addRow(header);
    ws.getRow(1).font = { bold: true };
    for (const t of tutors) {
      let first = true;
      for (const c of t.courses) {
        ws.addRow([
          first ? t.tutorNo ?? "" : "",
          first ? t.name : "",
          first ? t.phone ?? "" : "",
          first ? t.payeeName ?? "" : "",
          first ? t.bankCode ?? "" : "",
          first ? t.bankAccount ?? "" : "",
          c.school,
          c.course,
          c.count,
          c.amount,
        ]);
        first = false;
      }
      const sub = ws.addRow([
        `${t.name} 小計`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        t.subtotal,
      ]);
      sub.font = { bold: true };
    }
    const total = ws.addRow(["總計", "", "", "", "", "", "", "", "", grandTotal]);
    total.font = { bold: true };
    ws.columns.forEach((col) => (col.width = 16));

    const buffer = await wb.xlsx.writeBuffer();
    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="payroll-${month}.xlsx"`,
      },
    });
  }

  // CSV
  const lines = [header.join(",")];
  for (const t of tutors) {
    let first = true;
    for (const c of t.courses) {
      lines.push(
        [
          first ? t.tutorNo ?? "" : "",
          first ? t.name : "",
          first ? t.phone ?? "" : "",
          first ? t.payeeName ?? "" : "",
          first ? t.bankCode ?? "" : "",
          first ? t.bankAccount ?? "" : "",
          c.school,
          c.course,
          c.count,
          c.amount,
        ]
          .map(csvCell)
          .join(",")
      );
      first = false;
    }
    lines.push(
      [`${t.name} 小計`, "", "", "", "", "", "", "", "", t.subtotal]
        .map(csvCell)
        .join(",")
    );
  }
  lines.push(
    ["總計", "", "", "", "", "", "", "", "", grandTotal].map(csvCell).join(",")
  );
  const csv = "﻿" + lines.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="payroll-${month}.csv"`,
    },
  });
}
