// فایل: app/courses/[slug]/sections/[sectionSlug]/layout.tsx
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
  params: Promise<{ slug: string; sectionSlug: string }>;
}) {
  const session = await getServerSession(authOptions);
  
  const resolvedParams = await params;
  const { slug, sectionSlug } = resolvedParams;
  const userId = session?.user?.id;

  const learningPathData = await db.learningPath.findUnique({
    where: { slug: slug },
    // --- شروع اصلاح نهایی و قطعی ---
    // فیلدهای price و discountPrice از داخل include حذف شدند.
    // پریزما به صورت خودکار تمام فیلدهای اصلی (scalar) را باز می‌گرداند.
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
    // --- پایان اصلاح نهایی و قطعی ---
  });

  if (!learningPathData) return redirect("/");

  const learningPathId = learningPathData.id;

  let isEnrolled = false;
  let progressCount = 0;

  if (userId) {
    const enrollment = await db.enrollment.findUnique({
      where: { userId_learningPathId: { userId, learningPathId } },
    });
    isEnrolled = !!enrollment;
    progressCount = await getProgress(userId, learningPathId);
  }

  let chapterTitle = "";
  let sectionTitle = "";
  for (const level of learningPathData.levels) {
    for (const chapter of level.chapters) {
      const section = chapter.sections.find(s => s.id === sectionSlug);
      if (section) {
        chapterTitle = chapter.title;
        sectionTitle = section.title;
        break;
      }
    }
    if (sectionTitle) break;
  }
  
  const breadcrumbData: BreadcrumbData = {
    courseId: learningPathId,
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