// فایل: app/(dashboard)/page.tsx
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CourseCard } from "@/components/CourseCard";
import { Prisma, Role } from "@prisma/client"; // Role را از پریزما ایمپورت کنید

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  // --- شروع تغییر کلیدی ---
  // ۱. بررسی کامل وجود کاربر و نقش
  if (!session?.user?.id) {
    return redirect("/login");
  }

  // ۲. استفاده از Double Assertion برای استخراج امن نقش
  const userRole = (session.user as unknown as { role: Role }).role;
  const userId = session.user.id;

  if (!userRole) {
    return redirect("/login");
  }
  // --- پایان تغییر کلیدی ---


  const whereClause: Prisma.LearningPathWhereInput = {};

  // اگر کاربر استاد است، فقط دوره‌های خودش را نشان بده
  if (userRole === "INSTRUCTOR") {
    whereClause.userId = userId;
  }
  // اگر ادمین باشد، whereClause خالی می‌ماند و همه دوره‌ها را می‌بیند

  const learningPaths = await db.learningPath.findMany({
    where: whereClause,
    include: {
      category: true,
      levels: {
        include: {
          chapters: {
            select: { id: true }
          }
        }
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مسیرهای یادگیری</h1>
        <Link href="/learning-paths/create">
          <Button>+ مسیر یادگیری جدید</Button>
        </Link>
      </div>

      {learningPaths.length > 0 ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mt-6">
          {learningPaths.map((path) => {
            const totalChapters = path.levels.reduce((acc, level) => acc + level.chapters.length, 0);

            return (
              <CourseCard
                key={path.id}
                id={path.id}
                title={path.title}
                imageUrl={path.imageUrl}
                chaptersLength={totalChapters}
                category={path.category?.name || "بدون دسته‌بندی"}
                status={path.status}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center text-sm text-muted-foreground mt-10">
          <p>شما هنوز هیچ مسیر یادگیری ایجاد نکرده‌اید.</p>
        </div>
      )}
    </div>
  );
}