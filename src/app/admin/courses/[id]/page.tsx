import Link from "next/link";
import { notFound } from "next/navigation";
import type { MaterialStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import ConfirmButton from "@/components/ConfirmButton";
import CourseHeader from "./CourseHeader";
import { deleteGroup } from "./groups/actions";
import {
  createMaterial,
  deleteMaterial,
  setMaterialStatus,
} from "./materials/actions";

const DAY = ["", "一", "二", "三", "四", "五", "六", "日"];

const MAT: Record<MaterialStatus, { label: string; cls: string }> = {
  NOT_PREPARED: { label: "未準備", cls: "bg-rose-600 text-white" },
  IN_PROGRESS: { label: "準備中", cls: "bg-amber-500 text-white" },
  PREPARED: { label: "已準備", cls: "bg-emerald-600 text-white" },
};
const MAT_ORDER: MaterialStatus[] = ["NOT_PREPARED", "IN_PROGRESS", "PREPARED"];

function fmtDate(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : null;
}

// 將課堂日期按年月組合，例如 "2026年6月1、8、15、22、29、30日"
function fmtLessonDates(dates: { date: Date }[]) {
  if (dates.length === 0) return null;
  const byMonth = new Map<string, number[]>();
  for (const { date } of dates) {
    const key = `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(date.getUTCDate());
  }
  return Array.from(byMonth.entries())
    .map(([k, days]) => `${k}${days.sort((a, b) => a - b).join("、")}日`)
    .join("；");
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      school: true,
      academicYear: true,
      groups: {
        orderBy: { name: "asc" },
        include: {
          _count: { select: { lessons: true } },
          lessons: { select: { date: true }, orderBy: { date: "asc" } },
        },
      },
      materials: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!course) notFound();

  return (
    <div className="mx-auto max-w-4xl p-6">
      <CourseHeader course={course} active="info" />

      <div className="space-y-5">
        {/* 學校 */}
        <Card
          title={`學校 · ${course.school.name}`}
          action={
            <Link
              href={`/admin/schools/${course.school.id}/edit`}
              className="rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
            >
              編輯學校
            </Link>
          }
        >
          <Grid>
            <Row k="地址" v={course.school.address} />
            <Row k="電話" v={course.school.phone} />
            <Row k="傳真" v={course.school.fax} />
            <Row k="學校負責人" v={course.school.contactPerson} />
            <Row k="負責人電話" v={course.school.contactPhone} />
            <Row k="負責人電郵" v={course.school.contactEmail} />
          </Grid>
        </Card>

        {/* 課程基本資料 */}
        <Card title="課程基本資料">
          <Grid>
            <Row k="學年" v={course.academicYear.label} />
            <Row k="課程代號" v={course.code} />
            <Row k="開始日期" v={fmtDate(course.startDate)} />
            <Row k="結束日期" v={fmtDate(course.endDate)} />
            <Row k="費用同單" v={course.feeNote} />
            <Row
              k="Invoicing"
              v={course.invoiceStatus === "COMPLETE" ? "已完成" : "未完成"}
            />
          </Grid>
          {course.notes && (
            <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
              備註：{course.notes}
            </p>
          )}
        </Card>

        {/* 導師要求 */}
        <Card title="導師要求">
          <Grid>
            <Row k="年資" v={course.tutorYearsRequired} />
            <Row k="提堂（資格）" v={course.tutorQualification} />
          </Grid>
          <Row k="其他要求" v={course.tutorOtherRequirements} block />
        </Card>

        {/* 課程要求 */}
        <Card title="課程要求">
          <Row k="內容" v={course.contentRequirement} block />
          <Grid>
            <Row k="物資要求" v={course.materialRequirement} />
            <Row k="授課語言" v={course.teachingLanguage} />
          </Grid>
        </Card>

        {/* 課程物料 */}
        <Card title="課程物料">
          {course.materials.length === 0 ? (
            <p className="mb-3 text-sm text-gray-400">尚未加入物料。</p>
          ) : (
            <div className="mb-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 text-left text-xs text-gray-500">
                  <tr>
                    <th className="px-2 py-2 font-medium">物料名稱</th>
                    <th className="px-2 py-2 font-medium">數量</th>
                    <th className="px-2 py-2 font-medium">狀態</th>
                    <th className="px-2 py-2 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {course.materials.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-2 py-2 font-medium">{m.name}</td>
                      <td className="px-2 py-2 text-gray-500">{m.quantity ?? "—"}</td>
                      <td className="px-2 py-2">
                        <div className="flex gap-1">
                          {MAT_ORDER.map((s) => {
                            const active = m.status === s;
                            return (
                              <form
                                key={s}
                                action={setMaterialStatus.bind(null, m.id, id, s)}
                              >
                                <button
                                  type="submit"
                                  className={
                                    "rounded-full px-2 py-0.5 text-[11px] " +
                                    (active
                                      ? MAT[s].cls
                                      : "border border-gray-200 text-gray-400 hover:bg-gray-100")
                                  }
                                >
                                  {MAT[s].label}
                                </button>
                              </form>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/courses/${id}/materials/${m.id}/edit`}
                            className="rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                          >
                            編輯
                          </Link>
                          <ConfirmButton
                            action={deleteMaterial.bind(null, m.id, id)}
                            message={`確定刪除物料「${m.name}」？`}
                            className="rounded-md border border-rose-200 px-2 py-0.5 text-xs text-rose-600 hover:bg-rose-50"
                          >
                            刪除
                          </ConfirmButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <form
            action={createMaterial.bind(null, id)}
            className="flex flex-wrap items-end gap-2 border-t border-gray-100 pt-3"
          >
            <div>
              <label className="mb-1 block text-xs text-gray-500">物料名稱</label>
              <input
                name="name"
                required
                placeholder="例如 學生工作紙"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">數量</label>
              <input
                type="number"
                name="quantity"
                min={0}
                className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              + 新增物料
            </button>
          </form>
        </Card>

        {/* 小組 */}
        <Card
          title="小組"
          action={
            <Link
              href={`/admin/courses/${id}/groups/new`}
              className="rounded-md bg-black px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-800"
            >
              + 新增小組
            </Link>
          }
        >
          {course.groups.length === 0 ? (
            <p className="text-sm text-gray-400">尚未建立小組。</p>
          ) : (
            <div className="space-y-4">
              {course.groups.map((g) => {
                const rows: [string, string][] = [
                  [
                    "學生年級",
                    g.studentGrades.length ? g.studentGrades.join(", ") : "—",
                  ],
                  ["學生人數", g.studentCount?.toString() ?? "—"],
                  ["上堂地點", g.classLocation ?? "—"],
                  ["物資擺放位置", g.materialLocation ?? "—"],
                  [
                    "星期",
                    g.daysOfWeek.length
                      ? g.daysOfWeek
                          .slice()
                          .sort((a, b) => a - b)
                          .map((dw) => `星期${DAY[dw]}`)
                          .join("、")
                      : "—",
                  ],
                  [
                    "課程時間",
                    g.startTime && g.endTime
                      ? `${g.startTime} - ${g.endTime}`
                      : "—",
                  ],
                  ["上課日期", fmtLessonDates(g.lessons) ?? "—"],
                  ["要求助教", g.requiresTA ? "是" : "否"],
                  ["要求助理", g.requiresAssistant ? "是" : "否"],
                ];
                return (
                  <div
                    key={g.id}
                    className="overflow-hidden rounded-xl border border-gray-200"
                  >
                    {/* 名稱 + 操作 */}
                    <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-2.5 text-sm">
                      <div>
                        <span className="text-gray-400">名稱：</span>
                        <span className="text-gray-900">{g.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/courses/${id}/groups/${g.id}/edit`}
                          className="rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                        >
                          編輯
                        </Link>
                        <ConfirmButton
                          action={deleteGroup.bind(null, g.id, id)}
                          message={`確定刪除小組「${g.name}」？其課堂亦會一併刪除。`}
                          className="rounded-md border border-rose-200 px-2 py-0.5 text-xs text-rose-600 hover:bg-rose-50"
                        >
                          刪除
                        </ConfirmButton>
                      </div>
                    </div>
                    {rows.map(([k, v]) => (
                      <div
                        key={k}
                        className="border-b border-gray-100 px-4 py-2.5 text-sm last:border-b-0"
                      >
                        <span className="text-gray-400">{k}：</span>
                        <span className="text-gray-900">{v}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-500">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      {children}
    </dl>
  );
}

function Row({
  k,
  v,
  block,
}: {
  k: string;
  v?: string | null;
  block?: boolean;
}) {
  return (
    <div className={"flex gap-2 text-sm" + (block ? " py-1" : "")}>
      <dt className="shrink-0 text-gray-400">{k}：</dt>
      <dd className="text-gray-900">{v || "—"}</dd>
    </div>
  );
}
