// فایل: app/(public)/courses/page.tsx
"use server";

import { db } from "@/lib/db";
import { CourseCatalogCard } from "@/components/CourseCatalogCard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function CoursesCatalogPage() {
  
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const courses = await db.learningPath.findMany({
    where: {
      // --- تغییر کلیدی در اینجا ---
      // به جای isPublished، از status استفاده می‌کنیم
      status: 'PUBLISHED',
    },
    include: {
      category: true,
      levels: {
        include: {
          chapters: {
            where: { isPublished: true },
            select: { id: true }
          }
        }
      },
      enrollments: {
        where: {
          userId: userId,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          کاتالوگ دوره‌ها
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          مسیر یادگیری خود را از بین بهترین دوره‌های آموزشی انتخاب کنید.
        </p>
      </div>

      {courses.length > 0 ? (
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {courses.map((course) => {
            const totalChapters = course.levels.reduce((acc, level) => acc + level.chapters.length, 0);

            return (
              <CourseCatalogCard
                key={course.id}
                id={course.id}
                title={course.title}
                imageUrl={course.imageUrl}
                chaptersLength={totalChapters}
                category={course.category?.name || "بدون دسته‌بندی"}
                isEnrolled={course.enrollments.length > 0}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center text-md text-muted-foreground mt-10">
          <p>متاسفانه در حال حاضر هیچ دوره منتشر شده‌ای وجود ندارد.</p>
        </div>
      )}
    </div>
  );
}