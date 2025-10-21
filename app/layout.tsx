// فایل: app/layout.tsx

import type { Metadata } from "next";
// ۱. به جای next/font/google، ما از next/font/local استفاده می‌کنیم
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/providers"; 

// ۲. فونت را از فایل محلی خودتان تعریف کنید
const vazir = localFont({
  src: "../public/fonts/Vazirmatn[wght].woff2", 
  display: "swap", // این گزینه برای عملکرد بهتر توصیه می‌شود
  variable: "--font-vazir" // (اختیاری) اگر از متغیر CSS استفاده می‌کنید
});

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
      {/* ۳. کلاس فونت را به تگ body اعمال کنید */}
      <body className={vazir.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}