
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
  if (!session?.user?.id) return redirect("/login");

  const resolvedParams = await params;
  const { learningPathId, sectionId } = resolvedParams;
  const userId = session.user.id;

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

  const isOwner = learningPathData.userId === userId;
  // +++ ۱. وضعیت ثبت‌نام را اینجا مشخص می‌کنیم +++
  const enrollment = await db.enrollment.findUnique({
    where: { userId_learningPathId: { userId, learningPathId } },
  });
  
  // اگر کاربر مالک دوره نباشد و ثبت‌نام هم نکرده باشد، اجازه ورود نمی‌دهیم
  if (!isOwner && !enrollment) {
    // البته این منطق باید بهبود یابد تا اجازه دیدن بخش‌های رایگان را بدهد
    // که در گام بعدی (محافظت از محتوا) انجام می‌دهیم.
    // فعلاً فرض می‌کنیم برای ورود به این صفحه باید ثبت‌نام کرده باشد.
    return redirect(`/courses/${learningPathId}`);
  }
  
  const isEnrolled = !!enrollment;

  const progressCount = await getProgress(userId, learningPathData.id);

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
      isEnrolled={isEnrolled} // +++ ۲. وضعیت ثبت‌نام را پاس می‌دهیم +++
    >
      {children}
    </CoursePlayerLayout>
  );
}