// فایل: app/courses/[learningPathId]/sections/[sectionId]/layout.tsx
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getProgress } from "@/actions/get-progress";
import { CoursePlayerLayout } from "../../../_components/CoursePlayerLayout";

// +++ ۱. یک تایپ جدید برای داده‌های Breadcrumb تعریف می‌کنیم +++
export type BreadcrumbData = {
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
  if (!session?.user?.id) return redirect("/login");

  const resolvedParams = await params;
  const { learningPathId, sectionId } = resolvedParams; // sectionId را اینجا نیاز داریم
  const userId = session.user.id;

  const learningPathData = await db.learningPath.findUnique({
    where: { 
      id: learningPathId 
    },
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

  // ... (کد بررسی مالکیت و ثبت‌نام بدون تغییر باقی می‌ماند) ...
  const isOwner = learningPathData.userId === userId;
  if (!isOwner) {
    const enrollment = await db.enrollment.findUnique({
      where: { userId_learningPathId: { userId, learningPathId } },
    });
    if (!enrollment) return redirect("/courses");
  }

  const progressCount = await getProgress(userId, learningPathData.id);

  // +++ ۲. داده‌های لازم برای Breadcrumb را پیدا می‌کنیم +++
  let chapterTitle = "";
  let sectionTitle = "";

  // حلقه‌ای برای پیدا کردن فصل و بخش فعلی
  for (const level of learningPathData.levels) {
    for (const chapter of level.chapters) {
      const section = chapter.sections.find(s => s.id === sectionId);
      if (section) {
        chapterTitle = chapter.title;
        sectionTitle = section.title;
        break; // بعد از پیدا شدن، از حلقه خارج شو
      }
    }
    if (sectionTitle) break;
  }
  
  const breadcrumbData: BreadcrumbData = {
    courseTitle: learningPathData.title,
    chapterTitle,
    sectionTitle
  };
  // +++ پایان بخش واکشی داده‌ها +++


  return (
    // +++ ۳. داده‌های Breadcrumb را به CoursePlayerLayout پاس می‌دهیم +++
    <CoursePlayerLayout
      learningPath={learningPathData}
      progressCount={progressCount}
      breadcrumbData={breadcrumbData} // پراپ جدید
    >
      {children}
    </CoursePlayerLayout>
  );
}