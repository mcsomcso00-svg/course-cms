import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import ThemeToggle from "@/components/ThemeToggle";

const tabs = [
  { href: "/tutor", label: "打卡" },
  { href: "/tutor/confirmations", label: "工作確認書" },
  { href: "/tutor/pay", label: "我的紀錄" },
];

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/tutor-login");
  if (session.user.role !== "TUTOR") redirect("/admin");

  const today = new Date().toLocaleDateString("zh-HK", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-gray-50">
      <header className="bg-white px-4 pt-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs tracking-widest text-gray-400">
              STARDIAN 打卡系統
            </div>
            <div className="mt-0.5 text-sm font-semibold">{today}</div>
            <div className="text-xs text-gray-500">{session.user.name}</div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="px-2 py-1 text-xs" />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/tutor-login" });
              }}
            >
              <button type="submit" className="text-xs text-gray-400">
                登出
              </button>
            </form>
          </div>
        </div>
        <nav className="mt-3 flex gap-1 border-b border-gray-200">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="border-b-2 border-transparent px-3 py-2 text-sm text-gray-600 hover:text-black"
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
