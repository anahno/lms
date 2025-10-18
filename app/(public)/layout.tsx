// فایل: app/(public)/layout.tsx

import { PublicNavbar } from "@/components/PublicNavbar";
import { Footer } from "@/components/Footer"; // ۱. فوتر را وارد کنید

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ۲. رنگ پس‌زمینه را به سفید تغییر دادیم تا با نمونه هماهنگ باشد
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <main className="pt-10 pb-20">
        {children}
      </main>
      {/* ۳. فوتر را به لی‌آوت اضافه کنید */}
      <Footer />
    </div>
  );
}