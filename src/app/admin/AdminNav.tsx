"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { logout } from "./actions";

type NavItem = { label: string; href?: string; ready: boolean };

function Brand() {
  return (
    <div>
      <div className="text-lg font-black tracking-widest">STARDIAN</div>
      <div className="text-xs tracking-[0.3em] text-gray-500">星佑教育</div>
      <div className="mt-1 text-[11px] text-gray-400">見微知著 · 準備您所需</div>
    </div>
  );
}

function NavLinks({
  nav,
  onNavigate,
}: {
  nav: NavItem[];
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-0.5 p-3">
      {nav.map((item) =>
        item.ready && item.href ? (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
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
  );
}

function UserFooter({ userName }: { userName: string }) {
  return (
    <div className="border-t border-gray-200 p-3">
      <p className="px-3 pb-2 text-xs text-gray-500">{userName}</p>
      <div className="mb-1 px-1">
        <ThemeToggle className="w-full text-left" />
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100"
        >
          登出
        </button>
      </form>
    </div>
  );
}

export default function AdminNav({
  nav,
  userName,
}: {
  nav: NavItem[];
  userName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 桌面側欄 */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="border-b border-gray-200 px-5 py-4">
          <Brand />
        </div>
        <NavLinks nav={nav} />
        <UserFooter userName={userName} />
      </aside>

      {/* 手機頂欄 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="開啟選單"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          ☰ 選單
        </button>
      </div>

      {/* 手機抽屜 */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[#00000080]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white">
            <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="關閉選單"
                className="text-gray-400"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks nav={nav} onNavigate={() => setOpen(false)} />
            </div>
            <UserFooter userName={userName} />
          </div>
        </div>
      )}
    </>
  );
}
