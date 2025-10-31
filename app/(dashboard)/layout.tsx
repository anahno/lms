// فایل کامل و نهایی: app/(dashboard)/layout.tsx

import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import { Toaster } from "react-hot-toast";

// ==================== شروع تغییر اصلی ====================
// این خط به Next.js می‌گوید که این layout و تمام صفحات فرزند آن
// (یعنی کل داشبورد) باید در هر درخواست به صورت داینامیک رندر شوند
// و هرگز نباید در سمت سرور کش شوند.
export const dynamic = 'force-dynamic';
// ===================== پایان تغییر اصلی =====================

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Toaster position="bottom-center" /> 
        <Header />
        <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
          {children}
        </div>
      </main>
    </div>
  );
}