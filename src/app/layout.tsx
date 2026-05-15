import type { Metadata } from "next";
import "./globals.css";
import { zh } from "@/lib/zh";

export const metadata: Metadata = {
  title: zh.appTitle,
  description: zh.appDescription,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
