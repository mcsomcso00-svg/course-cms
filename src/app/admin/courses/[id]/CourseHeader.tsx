import Link from "next/link";
import type { CourseStatus } from "@prisma/client";
import ConfirmButton from "@/components/ConfirmButton";
import { deleteCourse, duplicateCourse } from "../actions";

const STATUS: Record<CourseStatus, { label: string; cls: string }> = {
  PLANNED: { label: "計劃中", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  CONFIRMED: { label: "已確認", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ONGOING: { label: "進行中", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  COMPLETED: { label: "已完成", cls: "bg-gray-100 text-gray-500 border-gray-200" },
  CANCELLED: { label: "已取消", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

export default function CourseHeader({
  course,
  active,
}: {
  course: { id: string; name: string; status: CourseStatus };
  active: "info" | "lessons" | "batch" | "confirm";
}) {
  const s = STATUS[course.status];
  const tabs = [
    { key: "info", label: "課程基本信息", href: `/admin/courses/${course.id}` },
    { key: "lessons", label: "課堂詳情", href: `/admin/courses/${course.id}/lessons` },
    { key: "batch", label: "批量更新", href: `/admin/courses/${course.id}/batch` },
    { key: "confirm", label: "工作確認書", href: `/admin/courses/${course.id}/confirmations` },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-gray-500 hover:underline">
            ← 課程列表
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">{course.name}</h1>
            <span className={"rounded-full border px-2.5 py-0.5 text-xs " + s.cls}>
              {s.label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/courses/${course.id}/edit`}
            className="rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            編輯課程
          </Link>
          <ConfirmButton
            action={duplicateCourse.bind(null, course.id)}
            message="確定複製此課程？（會一併複製小組，不含課堂）"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
          >
            複製課程
          </ConfirmButton>
          <ConfirmButton
            action={deleteCourse.bind(null, course.id)}
            message="確定刪除此課程？小組、課堂及物料將一併刪除，且無法復原。"
            className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
          >
            刪除
          </ConfirmButton>
        </div>
      </div>

      <div className="mb-6 flex gap-1 border-b border-gray-200">
        {tabs.map((t) =>
          t.href ? (
            <Link
              key={t.key}
              href={t.href}
              className={
                "border-b-2 px-3 py-2 text-sm " +
                (t.key === active
                  ? "border-black font-medium text-black"
                  : "border-transparent text-gray-500 hover:text-black")
              }
            >
              {t.label}
            </Link>
          ) : (
            <span
              key={t.key}
              title="建設中"
              className="cursor-not-allowed border-b-2 border-transparent px-3 py-2 text-sm text-gray-300"
            >
              {t.label}
            </span>
          )
        )}
      </div>
    </div>
  );
}
