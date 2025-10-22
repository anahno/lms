// فایل: app/(dashboard)/admin/reports/page.tsx
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { AdvancedReportsClient } from "./_components/AdvancedReportsClient";

export default async function AdvancedReportsPage() {
  const session = await getServerSession(authOptions);
  
  // این صفحه فقط برای ادمین قابل دسترس است
  if (!session?.user?.id || (session.user as { role: Role }).role !== "ADMIN") {
    return redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">گزارش‌گیری پیشرفته</h1>
        <p className="text-muted-foreground mt-2">
          داده‌های خام پلتفرم را برای تحلیل‌های عمیق‌تر در قالب فایل CSV دانلود کنید.
        </p>
      </div>
      
      <AdvancedReportsClient />
    </div>
  );
}