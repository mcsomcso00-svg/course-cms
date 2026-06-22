import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import ConfirmButton from "@/components/ConfirmButton";
import { deleteTutor } from "./actions";

const FIELDS: { key: string; label: string; col: keyof Prisma.UserWhereInput }[] = [
  { key: "tutorNo", label: "編號", col: "tutorNo" },
  { key: "region", label: "地區", col: "region" },
  { key: "name", label: "導師姓名", col: "name" },
  { key: "phone", label: "電話", col: "phone" },
  { key: "subjects", label: "任教科目", col: "subjects" },
  { key: "gender", label: "性別", col: "gender" },
];

const PAGE_SIZE = 20;

function d(dt: Date | null) {
  return dt ? dt.toISOString().slice(0, 10) : "";
}

function fmtDse(s: string | null) {
  if (!s) return "—";
  try {
    const o = JSON.parse(s);
    if (o && typeof o === "object" && !Array.isArray(o)) {
      const parts = Object.entries(o)
        .filter(([, v]) => String(v).trim())
        .map(([k, v]) => `${k}:${v}`);
      return parts.length ? parts.join(" ") : "—";
    }
  } catch {
    return s;
  }
  return s;
}

function FilterSelect({ name, value }: { name: string; value?: string }) {
  return (
    <select
      name={name}
      defaultValue={value ?? ""}
      className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
    >
      <option value="">請選擇</option>
      {FIELDS.map((f) => (
        <option key={f.key} value={f.key}>
          {f.label}
        </option>
      ))}
    </select>
  );
}

export default async function TutorsPage({
  searchParams,
}: {
  searchParams: Promise<{
    f1?: string;
    v1?: string;
    f2?: string;
    v2?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;

  const conds: Prisma.UserWhereInput[] = [];
  for (const [f, v] of [
    [sp.f1, sp.v1],
    [sp.f2, sp.v2],
  ] as const) {
    const field = FIELDS.find((x) => x.key === f);
    if (field && v?.trim()) {
      conds.push({ [field.col]: { contains: v.trim(), mode: "insensitive" } });
    }
  }
  const where: Prisma.UserWhereInput = { role: "TUTOR", AND: conds };

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const [total, tutors] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (p: number) => {
    const u = new URLSearchParams();
    if (sp.f1) u.set("f1", sp.f1);
    if (sp.v1) u.set("v1", sp.v1);
    if (sp.f2) u.set("f2", sp.f2);
    if (sp.v2) u.set("v2", sp.v2);
    u.set("page", String(p));
    return `/admin/tutors?${u.toString()}`;
  };

  const th = "whitespace-nowrap px-3 py-2 font-medium";
  const td = "whitespace-nowrap px-3 py-2";

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">導師</h1>
        <div className="flex flex-wrap items-center gap-2">
          <form action="/admin/tutors" className="flex flex-wrap items-center gap-2">
            <FilterSelect name="f1" value={sp.f1} />
            <input
              name="v1"
              defaultValue={sp.v1 ?? ""}
              placeholder="關鍵字"
              className="w-28 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            <FilterSelect name="f2" value={sp.f2} />
            <input
              name="v2"
              defaultValue={sp.v2 ?? ""}
              placeholder="關鍵字"
              className="w-28 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            <button
              type="submit"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
            >
              搜尋
            </button>
          </form>
          <Link
            href="/admin/import/tutors"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            ⬆ 批量匯入
          </Link>
          <Link
            href="/admin/tutors/new"
            className="rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            + 創建導師
          </Link>
        </div>
      </div>

      <div className="mb-2 text-xs text-gray-400">共 {total} 位導師</div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 text-left text-xs text-gray-500">
            <tr>
              <th className={th}>編號</th>
              <th className={th}>姓名</th>
              <th className={th}>地區</th>
              <th className={th}>任教科目</th>
              <th className={th}>電話</th>
              <th className={th}>電郵</th>
              <th className={th}>性別</th>
              <th className={th}>SCRC到期</th>
              <th className={th}>DSE</th>
              <th className={th}>學歷</th>
              <th className={th}>身份證號碼</th>
              <th className={th}>收款人</th>
              <th className={th}>銀行編號</th>
              <th className={th}>銀行戶口</th>
              <th className={th}>狀態</th>
              <th className={th}>行動</th>
            </tr>
          </thead>
          <tbody>
            {tutors.length === 0 ? (
              <tr>
                <td colSpan={16} className="px-4 py-8 text-center text-gray-500">
                  沒有符合的導師。
                </td>
              </tr>
            ) : (
              tutors.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 last:border-b-0">
                  <td className={td}>{t.tutorNo ?? "—"}</td>
                  <td className={td + " font-medium"}>{t.name}</td>
                  <td className={td}>{t.region ?? "—"}</td>
                  <td className="max-w-[14rem] truncate px-3 py-2">{t.subjects ?? "—"}</td>
                  <td className={td}>{t.phone ?? "—"}</td>
                  <td className={td}>{t.email ?? "—"}</td>
                  <td className={td}>{t.gender ?? "—"}</td>
                  <td className={td}>{d(t.scrcExpiry) || "—"}</td>
                  <td className={td}>{fmtDse(t.dseResult)}</td>
                  <td className={td}>{t.education ?? "—"}</td>
                  <td className={td}>{t.hkid ?? "—"}</td>
                  <td className={td}>{t.payeeName ?? "—"}</td>
                  <td className={td}>{t.bankCode ?? "—"}</td>
                  <td className={td}>{t.bankAccount ?? "—"}</td>
                  <td className={td}>
                    {t.isActive ? (
                      <span className="text-emerald-600">在職</span>
                    ) : (
                      <span className="text-gray-400">停用</span>
                    )}
                  </td>
                  <td className={td}>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/tutors/${t.id}/edit`}
                        className="rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                      >
                        編輯
                      </Link>
                      <ConfirmButton
                        action={deleteTutor.bind(null, t.id)}
                        message={`確定刪除導師「${t.name}」？其課堂會設為空缺，打卡及工作確認書紀錄會一併刪除，且無法復原。`}
                        className="rounded-md border border-rose-200 px-2 py-0.5 text-xs text-rose-600 hover:bg-rose-50"
                      >
                        刪除
                      </ConfirmButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-100">
              上一頁
            </Link>
          ) : (
            <span className="rounded-lg border border-gray-200 px-3 py-1.5 text-gray-300">上一頁</span>
          )}
          <span className="text-gray-500">
            第 {page} / {totalPages} 頁
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-100">
              下一頁
            </Link>
          ) : (
            <span className="rounded-lg border border-gray-200 px-3 py-1.5 text-gray-300">下一頁</span>
          )}
        </div>
      )}
    </div>
  );
}
