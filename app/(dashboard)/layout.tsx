// فایل: app/(dashboard)/layout.tsx

import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import { Toaster } from "react-hot-toast"; // ۱. وارد کردن Toaster

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        {/* ۲. اضافه کردن کامپوننت Toaster */}
        <Toaster position="bottom-center" /> 
        <Header />
        <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
          {children}
        </div>
      </main>
    </div>
  );
}