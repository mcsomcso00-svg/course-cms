import { getPayroll } from "./data";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const todayMonth = new Date()
    .toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong" })
    .slice(0, 7);
  const month =
    sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : todayMonth;

  const { tutors, grandTotal, checkInCount } = await getPayroll(month);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">糧單</h1>
        <div className="flex flex-wrap items-center gap-2">
          <form action="/admin/payroll" className="flex items-center gap-2">
            <input
              type="month"
              name="month"
              defaultValue={month}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            <button
              type="submit"
              className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              查詢
            </button>
          </form>
          <a
            href={`/admin/payroll/export?month=${month}&format=csv`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
          >
            下載 CSV
          </a>
          <a
            href={`/admin/payroll/export?month=${month}&format=xlsx`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
          >
            下載 XLSX
          </a>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-6 rounded-xl border border-gray-200 bg-white px-5 py-3">
        <div>
          <div className="text-xs text-gray-500">{month} 總堂費</div>
          <div className="text-2xl font-bold">${grandTotal}</div>
        </div>
        <div className="text-xs text-gray-400">
          {tutors.length} 位導師 · {checkInCount} 次打卡
        </div>
      </div>

      {tutors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          此月份未有打卡紀錄。導師打卡後堂費會在此結算。
        </div>
      ) : (
        <div className="space-y-4">
          {tutors.map((t) => (
            <div
              key={t.tutorId}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                <div>
                  <span className="font-semibold">{t.name}</span>
                  {t.phone && (
                    <span className="ml-2 text-xs text-gray-400">{t.phone}</span>
                  )}
                </div>
                <span className="text-sm font-semibold">小計 ${t.subtotal}</span>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {t.courses.map((c, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-50 last:border-b-0"
                    >
                      <td className="px-4 py-2 text-gray-500">{c.school}</td>
                      <td className="px-4 py-2">{c.course}</td>
                      <td className="px-4 py-2 text-right text-gray-400">
                        {c.count} 堂
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        ${c.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">
        堂費為導師打卡時按薪金規則（提早10分鐘 100%／遲到 30%）快照之金額。匯出檔已包含導師編號、收款人名及銀行戶口資料。
      </p>
    </div>
  );
}
