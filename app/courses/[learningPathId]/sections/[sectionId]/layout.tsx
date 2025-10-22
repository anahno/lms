// فایل: app/courses/[learningPathId]/sections/[sectionId]/layout.tsx
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getProgress } from "@/actions/get-progress";
import { CoursePlayerLayout } from "../../../_components/CoursePlayerLayout";

// +++ ۱. courseId را به تایپ اضافه می‌کنیم +++
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
  if (!isOwner) {
    const enrollment = await db.enrollment.findUnique({
      where: { userId_learningPathId: { userId, learningPathId } },
    });
    if (!enrollment) return redirect("/courses");
  }

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
    courseId: learningPathData.id, // +++ ۲. courseId را اینجا مقداردهی می‌کنیم +++
    courseTitle: learningPathData.title,
    chapterTitle,
    sectionTitle
  };


  return (
    <CoursePlayerLayout
      learningPath={learningPathData}
      progressCount={progressCount}
      breadcrumbData={breadcrumbData}
    >
      {children}
    </CoursePlayerLayout>
  );
}