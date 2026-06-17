import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function UsersPage() {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">用戶（管理員）</h1>
        <Link
          href="/admin/users/new"
          className="rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          + 創建用戶
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">姓名</th>
              <th className="px-4 py-2.5 font-medium">電郵</th>
              <th className="px-4 py-2.5 font-medium">狀態</th>
              <th className="px-4 py-2.5 font-medium">行動</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id} className="border-b border-gray-100 last:border-b-0">
                <td className="px-4 py-2.5 font-medium">{a.name}</td>
                <td className="px-4 py-2.5">{a.email}</td>
                <td className="px-4 py-2.5">
                  {a.isActive ? (
                    <span className="text-emerald-600">啟用</span>
                  ) : (
                    <span className="text-gray-400">停用</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/users/${a.id}/edit`}
                    className="rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                  >
                    編輯
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        此頁管理可登入後台的管理員帳戶。導師資料請於「導師」頁管理。
      </p>
    </div>
  );
}
