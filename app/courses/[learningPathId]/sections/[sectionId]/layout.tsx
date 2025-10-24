// فایل: app/courses/[learningPathId]/sections/[sectionId]/layout.tsx
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getProgress } from "@/actions/get-progress";
import { CoursePlayerLayout } from "../../../_components/CoursePlayerLayout";

export type BreadcrumbData = {
  courseId: string;
  courseTitle: string;
  chapterTitle: string;
  sectionTitle: string;
};

export default async function CourseSectionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ learningPathId: string; sectionId: string }>;
}) {
  const session = await getServerSession(authOptions);
  // --- ۱. خط کد ریدایرکت ناخواسته از اینجا به طور کامل حذف شد ---
  // if (!session?.user?.id) return redirect("/login"); <-- این خط حذف شد

  const resolvedParams = await params;
  const { learningPathId, sectionId } = resolvedParams;
  const userId = session?.user?.id; // اگر کاربر لاگین نباشد، این undefined خواهد بود

  const learningPathData = await db.learningPath.findUnique({
    where: { id: learningPathId },
    include: {
      levels: {
        orderBy: { position: "asc" },
        include: {
          chapters: {
            where: { isPublished: true },
            orderBy: { position: "asc" },
            include: {
              sections: {
                where: { isPublished: true },
                orderBy: { position: "asc" },
                include: {
                  progress: { where: { userId: userId } },
                  quiz: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!learningPathData) return redirect("/");

  let isEnrolled = false;
  let progressCount = 0;

  // --- ۲. فقط اگر کاربر لاگین کرده بود، وضعیت ثبت‌نام و پیشرفت را بررسی می‌کنیم ---
  if (userId) {
    const enrollment = await db.enrollment.findUnique({
      where: { userId_learningPathId: { userId, learningPathId } },
    });
    isEnrolled = !!enrollment;
    progressCount = await getProgress(userId, learningPathData.id);
  }

  // بقیه کد برای ساخت Breadcrumbs بدون تغییر باقی می‌ماند
  let chapterTitle = "";
  let sectionTitle = "";

  for (const level of learningPathData.levels) {
    for (const chapter of level.chapters) {
      const section = chapter.sections.find(s => s.id === sectionId);
      if (section) {
        chapterTitle = chapter.title;
        sectionTitle = section.title;
        break;
      }
    }
    if (sectionTitle) break;
  }
  
  const breadcrumbData: BreadcrumbData = {
    courseId: learningPathData.id,
    courseTitle: learningPathData.title,
    chapterTitle,
    sectionTitle
  };

  return (
    <CoursePlayerLayout
      learningPath={learningPathData}
      progressCount={progressCount}
      breadcrumbData={breadcrumbData}
      isEnrolled={isEnrolled}
    >
      {children}
    </CoursePlayerLayout>
  );
}