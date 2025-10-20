// فایل: app/(dashboard)/dashboard/page.tsx
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CourseCard } from "@/components/CourseCard";
import { Prisma, Role, CourseStatus } from "@prisma/client";

// یک دیکشنری برای نمایش عناوین فارسی هر وضعیت
const statusTitles: Record<CourseStatus, string> = {
  [CourseStatus.DRAFT]: "پیش‌نویس‌ها",
  [CourseStatus.PENDING]: "در انتظار تایید",
  [CourseStatus.PUBLISHED]: "منتشر شده",
};

// ترتیب نمایش گروه‌ها
const statusOrder: CourseStatus[] = [
  CourseStatus.DRAFT,
  CourseStatus.PENDING,
  CourseStatus.PUBLISHED,
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return redirect("/login");
  }

  const userRole = (session.user as unknown as { role: Role }).role;
  const userId = session.user.id;

  const whereClause: Prisma.LearningPathWhereInput = {};

  // اگر کاربر استاد است، فقط دوره‌های خودش را نشان بده
  if (userRole === "INSTRUCTOR") {
    whereClause.userId = userId;
  }
  // برای ادمین، whereClause خالی می‌ماند تا همه دوره‌ها نمایش داده شود

  const learningPaths = await db.learningPath.findMany({
    where: whereClause,
    include: {
      user: true, // ۱. اطلاعات استاد (User) را واکشی می‌کنیم
      category: true, // ۲. اطلاعات دسته‌بندی را برای مرتب‌سازی نیاز داریم
      levels: {
        include: {
          chapters: {
            select: { id: true }
          }
        }
      },
    },
    // ۳. دیگر در کوئری مرتب‌سازی نمی‌کنیم، چون منطق پیچیده‌تر است
  });

  // ۴. گروه‌بندی و مرتب‌سازی دوره‌ها در کد
  const groupedAndSortedCourses: { [key in CourseStatus]?: typeof learningPaths } = {};

  learningPaths.forEach(path => {
    if (!groupedAndSortedCourses[path.status]) {
      groupedAndSortedCourses[path.status] = [];
    }
    groupedAndSortedCourses[path.status]!.push(path);
  });

  // مرتب‌سازی هر گروه بر اساس نام دسته‌بندی
  for (const status in groupedAndSortedCourses) {
    groupedAndSortedCourses[status as CourseStatus]?.sort((a, b) => {
      const categoryA = a.category?.name || "zzzz"; // اگر دسته‌بندی نداشت در آخر قرار بگیرد
      const categoryB = b.category?.name || "zzzz";
      return categoryA.localeCompare(categoryB);
    });
  }

  const hasAnyCourse = learningPaths.length > 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مسیرهای یادگیری</h1>
        <Link href="/learning-paths/create">
          <Button>+ مسیر یادگیری جدید</Button>
        </Link>
      </div>

      {hasAnyCourse ? (
        <div className="space-y-10 mt-6">
          {/* ۵. به ترتیب وضعیت‌ها، گروه‌ها را رندر می‌کنیم */}
          {statusOrder.map(status => (
            groupedAndSortedCourses[status] && groupedAndSortedCourses[status]!.length > 0 && (
              <section key={status}>
                <h2 className="text-xl font-semibold mb-4 border-r-4 border-sky-500 pr-3">
                  {statusTitles[status]}
                </h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
                  {groupedAndSortedCourses[status]!.map((path) => {
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
                        // ۶. اطلاعات کامل استاد را به کامپوننت پاس می‌دهیم
                        instructor={path.user}
                      />
                    );
                  })}
                </div>
              </section>
            )
          ))}
        </div>
      ) : (
        <div className="text-center text-sm text-muted-foreground mt-10">
          <p>شما هنوز هیچ مسیر یادگیری ایجاد نکرده‌اید.</p>
        </div>
      )}
    </div>
  );
}