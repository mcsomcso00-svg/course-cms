import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

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
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="text-lg font-black tracking-widest">STARDIAN</div>
          <div className="text-xs tracking-[0.3em] text-gray-500">星佑教育</div>
          <div className="mt-1 text-[11px] text-gray-400">
            見微知著 · 準備您所需
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {nav.map((item) =>
            item.ready && item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                {item.label}
              </Link>
            ) : (
              <div
                key={item.label}
                title="建設中"
                className="cursor-not-allowed rounded-lg px-3 py-2 text-sm text-gray-300"
              >
                {item.label}
              </div>
            )
          )}
        </nav>

        <div className="border-t border-gray-200 p-3">
          <p className="px-3 pb-2 text-xs text-gray-500">{session.user.name}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100"
            >
              登出
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden bg-gray-50">{children}</main>
    </div>
  );
}
