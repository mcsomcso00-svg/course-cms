import Link from "next/link";
import type { ConfirmationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { setConfirmationStatus } from "./actions";

const CSTATUS: Record<ConfirmationStatus, { label: string; cls: string }> = {
  PENDING: { label: "未簽署", cls: "text-amber-600" },
  SIGNED: { label: "已簽署", cls: "text-emerald-600" },
  CONFIRMED: { label: "已確認", cls: "text-sky-600" },
  VOID: { label: "停用", cls: "text-gray-400" },
};

export default async function GlobalConfirmationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status as ConfirmationStatus | undefined;
  const q = sp.q?.trim() || undefined;

  const confirmations = await prisma.jobConfirmation.findMany({
    where: {
      ...(status && CSTATUS[status] ? { status } : {}),
      ...(q
        ? {
            OR: [
              { tutor: { name: { contains: q, mode: "insensitive" } } },
              { course: { name: { contains: q, mode: "insensitive" } } },
              { course: { school: { name: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    include: { tutor: true, course: { include: { school: true } } },
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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">工作確認書</h1>
        <form action="/admin/confirmations" className="flex items-center gap-2">
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="">全部狀態</option>
            <option value="PENDING">未簽署</option>
            <option value="SIGNED">已簽署</option>
            <option value="CONFIRMED">已確認</option>
            <option value="VOID">停用</option>
          </select>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="搜尋導師 / 課程 / 學校"
            className="w-48 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            查詢
          </button>
        </form>
      </div>

      {confirmations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          沒有符合條件的工作確認書。
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
                <th className="px-4 py-2.5 font-medium">操作</th>
                <th className="px-4 py-2.5 font-medium">PDF</th>
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
                    <td className="px-4 py-2.5">{c.course?.school.name ?? "—"}</td>
                    <td className="px-4 py-2.5">{c.course?.name ?? c.title}</td>
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
                        {c.status !== "CONFIRMED" && !voided && (
                          <form action={setConfirmationStatus.bind(null, c.id, "CONFIRMED")}>
                            <button
                              type="submit"
                              className="rounded-md border border-sky-200 px-2 py-0.5 text-xs text-sky-700 hover:bg-sky-50"
                            >
                              確認
                            </button>
                          </form>
                        )}
                        <form
                          action={setConfirmationStatus.bind(
                            null,
                            c.id,
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
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <a
                        href={`/api/jc/${c.id}/pdf`}
                        className="rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                      >
                        PDF
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">
        狀態：未簽署 → 已簽署 → 已確認；停用可作廢。導師於手機簽署後，狀態轉為「已簽署」。
      </p>
    </div>
  );
}
