import Link from "next/link";
import type { School } from "@prisma/client";

const fieldCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

function Field({
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

export default function SchoolForm({
  action,
  school,
  title,
}: {
  action: (formData: FormData) => void;
  school?: School;
  title: string;
}) {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <Link href="/admin" className="text-sm text-gray-500 hover:underline">
          ← 返回
        </Link>
      </div>

      <form
        action={action}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-6"
      >
        <Field label="學校名稱" name="name" defaultValue={school?.name} required />
        <Field label="地址" name="address" defaultValue={school?.address} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">電話</label>
            <div className="flex gap-2">
              <input
                value="852"
                readOnly
                title="電話區號"
                className={fieldCls + " w-16 bg-gray-50 text-center"}
              />
              <input
                name="phone"
                defaultValue={school?.phone ?? ""}
                className={fieldCls}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">傳真</label>
            <div className="flex gap-2">
              <input
                value="852"
                readOnly
                title="傳真區號"
                className={fieldCls + " w-16 bg-gray-50 text-center"}
              />
              <input
                name="fax"
                defaultValue={school?.fax ?? ""}
                className={fieldCls}
              />
            </div>
          </div>
        </div>
        <Field
          label="學校負責人"
          name="contactPerson"
          defaultValue={school?.contactPerson}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="負責人電話"
            name="contactPhone"
            defaultValue={school?.contactPhone}
          />
          <Field
            label="負責人電郵"
            name="contactEmail"
            type="email"
            defaultValue={school?.contactEmail}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">備註</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={school?.notes ?? ""}
            className={fieldCls}
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="mb-2 text-sm font-medium">導師打卡範圍（選填）</p>
          <p className="mb-2 text-xs text-gray-500">
            設定後，導師須在範圍內方可打卡；留空則不限制位置。
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="學校位置緯度"
              name="latitude"
              defaultValue={school?.latitude != null ? String(school.latitude) : ""}
            />
            <Field
              label="學校位置經度"
              name="longitude"
              defaultValue={school?.longitude != null ? String(school.longitude) : ""}
            />
          </div>
          <div className="mt-3">
            <Field
              label="最大可打卡距離（米為單位）"
              name="checkInRadius"
              defaultValue={
                school?.checkInRadius != null ? String(school.checkInRadius) : ""
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Link
            href="/admin"
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
