import Link from "next/link";
import type { Course } from "@prisma/client";

const fieldCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

function toDateInput(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "";
}

function Text({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className={fieldCls}
      />
    </div>
  );
}

function Area({
  label,
  name,
  defaultValue,
  rows = 2,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        className={fieldCls}
      />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-500">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function CourseForm({
  action,
  course,
  backHref,
  title,
}: {
  action: (formData: FormData) => void;
  course?: Course;
  backHref: string;
  title: string;
}) {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <Link href={backHref} className="text-sm text-gray-500 hover:underline">
          ← 返回
        </Link>
      </div>

      <form action={action} className="space-y-5">
        <Section title="基本資料">
          <Text label="課程名稱" name="name" defaultValue={course?.name} required />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Text label="課程代號" name="code" defaultValue={course?.code} />
            <div>
              <label className="mb-1 block text-sm font-medium">狀態</label>
              <select
                name="status"
                defaultValue={course?.status}
                className={fieldCls}
              >
                <option value="PLANNED">計劃中</option>
                <option value="CONFIRMED">已確認</option>
                <option value="ONGOING">進行中</option>
                <option value="COMPLETED">已完成</option>
                <option value="CANCELLED">已取消</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">開始日期</label>
              <input
                type="date"
                name="startDate"
                defaultValue={toDateInput(course?.startDate)}
                className={fieldCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">結束日期</label>
              <input
                type="date"
                name="endDate"
                defaultValue={toDateInput(course?.endDate)}
                className={fieldCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Text label="費用同單" name="feeNote" defaultValue={course?.feeNote} />
            <div>
              <label className="mb-1 block text-sm font-medium">Invoicing</label>
              <select
                name="invoiceStatus"
                defaultValue={course?.invoiceStatus}
                className={fieldCls}
              >
                <option value="INCOMPLETE">未完成</option>
                <option value="COMPLETE">已完成</option>
              </select>
            </div>
          </div>
          <Area label="備註" name="notes" defaultValue={course?.notes} />
          <Area
            label="工作計劃備註（教材計劃等）"
            name="workPlanNote"
            defaultValue={course?.workPlanNote}
            rows={4}
          />
        </Section>

        <Section title="導師要求">
          <Text
            label="年資"
            name="tutorYearsRequired"
            defaultValue={course?.tutorYearsRequired}
          />
          <Text
            label="提堂（資格）"
            name="tutorQualification"
            defaultValue={course?.tutorQualification}
          />
          <Area
            label="其他（性別、口齒、聲線、主修科目等）"
            name="tutorOtherRequirements"
            defaultValue={course?.tutorOtherRequirements}
          />
        </Section>

        <Section title="課程要求">
          <Area
            label="內容（包括參校類葉）"
            name="contentRequirement"
            defaultValue={course?.contentRequirement}
          />
          <Text
            label="物資要求"
            name="materialRequirement"
            defaultValue={course?.materialRequirement}
          />
          <Text
            label="授課語言"
            name="teachingLanguage"
            defaultValue={course?.teachingLanguage}
          />
        </Section>

        <div className="flex justify-end gap-2">
          <Link
            href={backHref}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
          >
            取消
          </Link>
          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            儲存
          </button>
        </div>
      </form>
    </div>
  );
}
