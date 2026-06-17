import Link from "next/link";
import { notFound } from "next/navigation";
import type { ConfirmationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import CourseHeader from "../CourseHeader";
import { setConfirmationStatus } from "./actions";

const CSTATUS: Record<ConfirmationStatus, { label: string; cls: string }> = {
  PENDING: { label: "未簽署", cls: "text-amber-600" },
  SIGNED: { label: "已簽署", cls: "text-emerald-600" },
  CONFIRMED: { label: "已確認", cls: "text-sky-600" },
  VOID: { label: "停用", cls: "text-gray-400" },
};

export default async function ConfirmationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: { school: true },
  });
  if (!course) notFound();

  const confirmations = await prisma.jobConfirmation.findMany({
    where: { courseId: id },
    include: { tutor: true },
    orderBy: { createdAt: "desc" },
  });

  const fmt = (d: Date) =>
    d.toLocaleString("zh-HK", {
      timeZone: "Asia/Hong_Kong",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <CourseHeader course={course} active="confirm" />

      {confirmations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          尚未製作任何工作確認書。可於「批量更新」分頁選擇導師及課堂後製作。
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">製作日期</th>
                <th className="px-4 py-2.5 font-medium">學校名稱</th>
                <th className="px-4 py-2.5 font-medium">課程名稱</th>
                <th className="px-4 py-2.5 font-medium">導師</th>
                <th className="px-4 py-2.5 font-medium">職位</th>
                <th className="px-4 py-2.5 font-medium">狀態</th>
                <th className="px-4 py-2.5 font-medium">詳情</th>
              </tr>
            </thead>
            <tbody>
              {confirmations.map((c) => {
                const st = CSTATUS[c.status];
                const voided = c.status === "VOID";
                return (
                  <tr key={c.id} className="border-b border-gray-100 last:border-b-0">
                    <td className="whitespace-nowrap px-4 py-2.5">
                      {fmt(c.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">{course.school.name}</td>
                    <td className="px-4 py-2.5">{course.name}</td>
                    <td className="px-4 py-2.5">{c.tutor.name}</td>
                    <td className="px-4 py-2.5">導師</td>
                    <td className={"px-4 py-2.5 font-medium " + st.cls}>
                      {st.label}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/confirmations/${c.id}`}
                          className="rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                        >
                          詳情
                        </Link>
                        <form
                          action={setConfirmationStatus.bind(
                            null,
                            c.id,
                            id,
                            voided ? "PENDING" : "VOID"
                          )}
                        >
                          <button
                            type="submit"
                            className="rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                          >
                            {voided ? "啟用" : "停用"}
                          </button>
                        </form>
                        <a
                          href={`/api/jc/${c.id}/pdf`}
                          className="rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                        >
                          PDF
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">
        可於「批量更新」分頁選擇導師及課堂後按「製作JC」建立工作確認書。
      </p>
    </div>
  );
}
