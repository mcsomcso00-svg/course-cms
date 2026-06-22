import Link from "next/link";
import { SECTION_ORDER, SPECS } from "@/lib/bulk/specs";

export const metadata = { title: "批量匯入" };

export default function ImportHub() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-xl font-bold tracking-tight">批量匯入</h1>
      <p className="mt-1 text-sm text-gray-500">
        下載範本 → 填入資料 → 上載 → 預覽核對 → 確認匯入。每個區段以指定欄位對應既有紀錄，已存在則更新、否則新增。
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SECTION_ORDER.map((key) => {
          const s = SPECS[key];
          return (
            <Link
              key={key}
              href={`/admin/import/${key}`}
              className="group rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold group-hover:underline">
                  {s.title}
                </span>
                <span className="text-xs text-gray-400">{s.columns.length} 欄</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-gray-500">
                {s.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
