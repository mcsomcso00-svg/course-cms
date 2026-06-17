import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "課程管理系統",
  description: "導師課程管理系統 — 課程、打卡、出糧、物料管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
