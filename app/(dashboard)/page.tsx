// فایل: app/(dashboard)/page.tsx

import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CourseCard } from "@/components/CourseCard"; // ۱. وارد کردن کامپوننت کارت

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirect("/login");
  }

  // ۲. دریافت تمام مسیرهای یادگیری کاربر به همراه اطلاعات مرتبط
  const learningPaths = await db.learningPath.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      category: true, // برای نمایش نام دسته‌بندی
      chapters: { // برای شمارش تعداد فصل‌ها
        select: { id: true }
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مسیرهای یادگیری من</h1>
        <Link href="/learning-paths/create">
          <Button>+ مسیر یادگیری جدید</Button>
        </Link>
      </div>

      {/* ۳. نمایش کارت‌ها در یک چیدمان شبکه‌ای */}
      {learningPaths.length > 0 ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mt-6">
          {learningPaths.map((path) => (
            <CourseCard
              key={path.id}
              id={path.id}
              title={path.title}
              imageUrl={path.imageUrl}
              chaptersLength={path.chapters.length}
              category={path.category?.name || "بدون دسته‌بندی"}
            />
          ))}
        </div>
      ) : (
        // ۴. نمایش پیام در صورتی که هیچ مسیری وجود نداشته باشد
        <div className="text-center text-sm text-muted-foreground mt-10">
          <p>شما هنوز هیچ مسیر یادگیری ایجاد نکرده‌اید.</p>
        </div>
      )}
    </div>
  );
}