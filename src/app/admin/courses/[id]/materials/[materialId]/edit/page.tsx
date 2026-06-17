import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateMaterial } from "../../actions";

const fieldCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

export default async function EditMaterialPage({
  params,
}: {
  params: Promise<{ id: string; materialId: string }>;
}) {
  const { id, materialId } = await params;
  const material = await prisma.materialItem.findUnique({
    where: { id: materialId },
  });
  if (!material) notFound();

  return (
    <div className="mx-auto max-w-lg p-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">編輯物料</h1>
        <Link
          href={`/admin/courses/${id}`}
          className="text-sm text-gray-500 hover:underline"
        >
          ← 返回
        </Link>
      </div>

      <form
        action={updateMaterial.bind(null, materialId, id)}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">
            物料名稱 <span className="text-rose-500">*</span>
          </label>
          <input name="name" required defaultValue={material.name} className={fieldCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">數量</label>
            <input
              type="number"
              name="quantity"
              min={0}
              defaultValue={material.quantity ?? ""}
              className={fieldCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">狀態</label>
            <select name="status" defaultValue={material.status} className={fieldCls}>
              <option value="NOT_PREPARED">未準備</option>
              <option value="IN_PROGRESS">準備中</option>
              <option value="PREPARED">已準備</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">備註</label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={material.notes ?? ""}
            className={fieldCls}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Link
            href={`/admin/courses/${id}`}
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
