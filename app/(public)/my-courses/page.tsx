// فایل: app/(public)/my-courses/page.tsx  <-- کد صحیح برای این فایل

"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProgress } from "@/actions/get-progress";
import { StudentCourseCard } from "@/components/StudentCourseCard";
import Link from "next/link";

export default async function MyCoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirect("/login");
  }
  const userId = session.user.id;

  const enrolledCourses = await db.learningPath.findMany({
    where: {
      status: 'PUBLISHED',
      enrollments: {
        some: {
          userId: userId,
        },
      },
    },
    include: {
      category: true,
      levels: {
        include: {
          chapters: {
            where: { isPublished: true },
            select: { id: true },
          },
        },
      },
    },
  });

  const coursesWithProgress = await Promise.all(
    enrolledCourses.map(async (course) => {
      const progress = await getProgress(userId, course.id);
      return {
        ...course,
        progress: progress,
      };
    })
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">دوره‌های من</h1>
      {coursesWithProgress.length > 0 ? (
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {coursesWithProgress.map((course) => (
            <StudentCourseCard
              key={course.id}
              id={course.id}
              title={course.title}
              imageUrl={course.imageUrl}
              category={course.category?.name || "بدون دسته‌بندی"}
              progress={course.progress}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-md text-muted-foreground mt-10">
          <p>شما هنوز در هیچ دوره‌ای ثبت‌نام نکرده‌اید.</p>
          <Link href="/courses" className="text-sky-600 hover:underline">مشاهده کاتالوگ دوره‌ها</Link>
        </div>
      )}
    </div>
  );
}