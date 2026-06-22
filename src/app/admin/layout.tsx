import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminNav from "./AdminNav";

const nav: { label: string; href?: string; ready: boolean }[] = [
  { label: "學校", href: "/admin", ready: true },
  { label: "上堂提醒", href: "/admin/reminders", ready: true },
  { label: "課程進度表", href: "/admin/progress", ready: true },
  { label: "工作計劃表", href: "/admin/work-plan", ready: true },
  { label: "導師請假表", href: "/admin/staffing", ready: true },
  { label: "導師搜索", href: "/admin/tutor-search", ready: true },
  { label: "工作確認書", href: "/admin/confirmations", ready: true },
  { label: "糧單", href: "/admin/payroll", ready: true },
  { label: "用戶", href: "/admin/users", ready: true },
  { label: "導師", href: "/admin/tutors", ready: true },
  { label: "批量匯入", href: "/admin/import", ready: true },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/tutor");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminNav nav={nav} userName={session.user.name ?? ""} />
      <main className="min-w-0 flex-1 overflow-x-hidden bg-gray-50">
        {children}
      </main>
    </div>
  );
}
