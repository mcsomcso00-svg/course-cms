import Link from "next/link";
import type { User } from "@prisma/client";
import DseInput from "./DseInput";

const fieldCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

function toDateInput(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "";
}

function F({
  label,
  name,
  defaultValue,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
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
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

export default function TutorForm({
  action,
  tutor,
  title,
}: {
  action: (formData: FormData) => void;
  tutor?: User;
  title: string;
}) {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <Link href="/admin/tutors" className="text-sm text-gray-500 hover:underline">
          ← 返回
        </Link>
      </div>

      <form action={action} className="space-y-5">
        <Section title="基本資料">
          <F label="導師姓名" name="name" defaultValue={tutor?.name} required />
          <F label="編號" name="tutorNo" defaultValue={tutor?.tutorNo} />
          <F label="電話" name="phone" defaultValue={tutor?.phone} />
          <F label="電子郵件" name="email" type="email" defaultValue={tutor?.email} />
          <F label="地區" name="region" defaultValue={tutor?.region} />
          <div>
            <label className="mb-1 block text-sm font-medium">性別</label>
            <select name="gender" defaultValue={tutor?.gender ?? ""} className={fieldCls}>
              <option value="">—</option>
              <option value="M">男</option>
              <option value="F">女</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">出生日期</label>
            <input type="date" name="dob" defaultValue={toDateInput(tutor?.dob)} className={fieldCls} />
          </div>
          <F label="身份證號碼" name="hkid" defaultValue={tutor?.hkid} />
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium">地址</label>
            <input name="address" defaultValue={tutor?.address ?? ""} className={fieldCls} />
          </div>
        </Section>

        <Section title="教學資料">
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium">任教科目</label>
            <input name="subjects" defaultValue={tutor?.subjects ?? ""} className={fieldCls} />
          </div>
          <DseInput defaultValue={tutor?.dseResult} />
          <div>
            <label className="mb-1 block text-sm font-medium">SCRC 到期</label>
            <input type="date" name="scrcExpiry" defaultValue={toDateInput(tutor?.scrcExpiry)} className={fieldCls} />
          </div>
          <F label="最高學歷" name="education" defaultValue={tutor?.education} />
          <F label="經驗" name="experience" defaultValue={tutor?.experience} />
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium">評語</label>
            <textarea name="remarks" rows={3} defaultValue={tutor?.remarks ?? ""} className={fieldCls} />
          </div>
        </Section>

        <Section title="薪金 / 銀行">
          <F label="每堂薪金 (HKD)" name="perLessonRate" type="number" defaultValue={tutor?.perLessonRate != null ? String(tutor.perLessonRate) : ""} />
          <F label="收款人名" name="payeeName" defaultValue={tutor?.payeeName} />
          <F label="銀行編號" name="bankCode" defaultValue={tutor?.bankCode} />
          <F label="銀行戶口" name="bankAccount" defaultValue={tutor?.bankAccount} />
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={tutor?.isActive ?? true} className="accent-black" />
            啟用（在職）
          </label>
        </Section>

        <div className="flex justify-end gap-2">
          <Link href="/admin/tutors" className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">
            取消
          </Link>
          <button type="submit" className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
            儲存
          </button>
        </div>
      </form>
    </div>
  );
}
