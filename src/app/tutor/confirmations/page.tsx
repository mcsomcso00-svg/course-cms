import Link from "next/link";
import { redirect } from "next/navigation";
import type { ConfirmationStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SignButton from "./SignButton";

const CSTATUS: Record<ConfirmationStatus, { label: string; cls: string }> = {
  PENDING: { label: "未簽署", cls: "text-amber-600" },
  SIGNED: { label: "已簽署", cls: "text-emerald-600" },
  CONFIRMED: { label: "已確認", cls: "text-sky-600" },
  VOID: { label: "停用", cls: "text-gray-400" },
};

function hm(d: Date) {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Hong_Kong",
  });
}

function fmtDates(dates: Date[]) {
  if (dates.length === 0) return "";
  const byMonth = new Map<string, number[]>();
  for (const d of [...dates].sort((a, b) => a.getTime() - b.getTime())) {
    const key = `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(d.getUTCDate());
  }
  return Array.from(byMonth.entries())
    .map(([k, days]) => `${k}${days.join("、")}日`)
    .join("；");
}

export default async function TutorConfirmationsPage() {
  const session = await auth();
  if (!session) redirect("/tutor-login");

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const confirmations = await prisma.jobConfirmation.findMany({
    where: {
      tutorId: session.user.id,
      status: { not: "VOID" },
      createdAt: { gte: oneYearAgo },
    },
    include: {
      course: { include: { school: true } },
      lessons: {
        include: { group: true },
        orderBy: { date: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <p className="mb-3 text-xs text-gray-500">
        所有工作確認書只會顯示在系統一年，如有需要，請自行匯出 PDF 檔儲存。
      </p>

      {confirmations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          沒有需要處理的工作確認書。
        </p>
      ) : (
        <div className="space-y-3">
          {confirmations.map((c) => {
            const st = CSTATUS[c.status];
            const groups = [...new Set(c.lessons.map((l) => l.group.name))].join(
              "、"
            );
            const times = [
              ...new Set(c.lessons.map((l) => `${hm(l.startAt)}-${hm(l.endAt)}`)),
            ].join("、");
            const dates = fmtDates(c.lessons.map((l) => l.date));
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm"
              >
                <div className="font-semibold">
                  {c.course?.school.name ?? "—"}
                </div>
                <div className="text-sm text-gray-600">{c.position ?? "導師"}</div>
                <div className="text-sm text-gray-700">
                  {c.course?.name ?? c.title}
                  {groups && `（${groups}）`}
                </div>
                {times && <div className="text-sm text-gray-700">{times}</div>}
                {dates && <div className="text-sm text-gray-700">{dates}</div>}
                <div className={"mt-1 text-sm font-medium " + st.cls}>
                  {st.label}
                </div>

                <div className="mt-3 flex justify-center gap-2">
                  {c.status === "PENDING" && <SignButton jcId={c.id} />}
                  <Link
                    href={`/tutor/confirmations/${c.id}`}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                  >
                    顯示詳情
                  </Link>
                  <a
                    href={`/api/jc/${c.id}/pdf`}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                  >
                    下載PDF
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
