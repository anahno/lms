// فایل: app/layout.tsx

import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
// ۲. کامپوننت Providers را از فایلی که ساختید وارد کنید
import Providers from "@/providers"; 

const vazir = Vazirmatn({ subsets: ["arabic"] });

export const metadata: Metadata = {
  title: "سیستم مدیریت یادگیری (LMS)",
  description: "پروژه ساخت LMS با Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={vazir.className}>
        {/* ۳. اینجا مهم‌ترین بخش است: children را داخل Providers قرار دهید */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}