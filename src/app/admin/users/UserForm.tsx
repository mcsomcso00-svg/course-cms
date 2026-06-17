import Link from "next/link";
import type { User } from "@prisma/client";

const fieldCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

export default function UserForm({
  action,
  user,
  title,
}: {
  action: (formData: FormData) => void;
  user?: User;
  title: string;
}) {
  const isEdit = !!user;
  return (
    <div className="mx-auto max-w-lg p-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <Link href="/admin/users" className="text-sm text-gray-500 hover:underline">
          ← 返回
        </Link>
      </div>

      <form
        action={action}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">
            姓名 <span className="text-rose-500">*</span>
          </label>
          <input name="name" required defaultValue={user?.name ?? ""} className={fieldCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            電郵 <span className="text-rose-500">*</span>
          </label>
          <input
            name="email"
            type="email"
            required
            defaultValue={user?.email ?? ""}
            className={fieldCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            密碼 {isEdit ? "（留空則不變）" : <span className="text-rose-500">*</span>}
          </label>
          <input
            name="password"
            type="password"
            required={!isEdit}
            autoComplete="new-password"
            className={fieldCls}
          />
        </div>
        {isEdit && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={user?.isActive ?? true}
              className="accent-black"
            />
            啟用
          </label>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Link
            href="/admin/users"
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
