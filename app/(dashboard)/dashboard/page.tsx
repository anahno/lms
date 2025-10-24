// فایل: app/(dashboard)/dashboard/page.tsx

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma, Role } from "@prisma/client";
import { 
    BookCopy, 
    Activity,
    MessageSquareWarning,
    PlusCircle // +++ ۱. ایمپورت آیکون PlusCircle +++
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

import { getDashboardStats } from "@/actions/get-dashboard-stats";
import { StatCard } from "./_components/StatCard";
import { CoursesByCategoryChart } from "./_components/CoursesByCategoryChart";
import { CourseCard } from "@/components/CourseCard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return redirect("/login");
  }

  const userId = session.user.id;
  const userRole = (session.user as unknown as { role: Role }).role;
  const isAdmin = userRole === "ADMIN";

  const courseWhereClause: Prisma.LearningPathWhereInput = isAdmin ? {} : { userId };

  const [stats, learningPaths] = await Promise.all([
    getDashboardStats(userId, isAdmin),
    db.learningPath.findMany({
        where: courseWhereClause,
        include: {
          user: true,
          category: true,
          levels: {
            include: { chapters: { select: { id: true } } }
          },
        },
        orderBy: { createdAt: 'desc' },
    })
  ]);

  const hasAnyCourse = learningPaths.length > 0;

  return (
    <div className="p-6 space-y-8">
      {/* --- شروع اصلاح اصلی --- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">داشبورد</h1>
          <p className="text-muted-foreground">نمای کلی از وضعیت پلتفرم و فعالیت‌های اخیر</p>
        </div>
        {/* +++ ۲. دکمه "ایجاد دوره جدید" در اینجا اضافه شد و همیشه نمایش داده می‌شود +++ */}
        <Link href="/learning-paths/create">
          <Button>
            <PlusCircle className="h-4 w-4 ml-2" />
            ایجاد دوره جدید
          </Button>
        </Link>
      </div>
      {/* --- پایان اصلاح اصلی --- */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-y-6">
            <StatCard 
                title="نرخ تعامل (هفته گذشته)"
                value={`${stats.engagementRate.toFixed(1)}%`}
                icon={Activity}
                description={`${stats.activeUsersLastWeek.toLocaleString('fa-IR')} کاربر فعال`}
                variant={stats.engagementRate > 50 ? "success" : (stats.engagementRate > 20 ? "warning" : "danger")}
            />
            <StatCard 
                title="سوالات بی‌پاسخ"
                value={stats.unansweredQuestions.toLocaleString('fa-IR')}
                icon={MessageSquareWarning}
                description="سوالات منتظر پاسخ"
                variant={stats.unansweredQuestions > 10 ? "danger" : (stats.unansweredQuestions > 0 ? "warning" : "success")}
            />
            <StatCard 
                title="تعداد کل دوره‌ها"
                value={stats.totalCourses.toLocaleString('fa-IR')}
                icon={BookCopy}
                description={`${stats.publishedCourses.toLocaleString('fa-IR')} دوره منتشر شده`}
            />
        </div>
        <div className="lg:col-span-2">
            <CoursesByCategoryChart data={stats.coursesByCategory} />
        </div>
      </div>
      
      {/* بخش آخرین دوره‌ها */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">آخرین دوره‌ها</h2>
            <Link href={isAdmin ? "/browse-courses" : "/dashboard"}>
                <Button variant="outline">مشاهده همه</Button>
            </Link>
        </div>
        {hasAnyCourse ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {learningPaths.slice(0, 3).map(path => {
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
                        instructor={path.user}
                        price={path.price}
                        discountPrice={path.discountPrice}
                      />
                    );
                })}
            </div>
        ) : (
            <div className="text-center text-sm text-muted-foreground mt-4 p-12 border-2 border-dashed rounded-lg bg-slate-50">
                <p>هنوز هیچ دوره‌ای ایجاد نکرده‌اید.</p>
                {/* دکمه قبلی که فقط در حالت خالی نمایش داده می‌شد، اکنون حذف شده و به بالای صفحه منتقل شده است */}
            </div>
        )}
      </div>
    </div>
  );
}