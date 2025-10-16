// فایل: app/courses/[learningPathId]/sections/[sectionId]/layout.tsx
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getProgress } from "@/actions/get-progress";
import { CoursePlayerLayout } from "../../../_components/CoursePlayerLayout";

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
  const { learningPathId } = resolvedParams;
  const userId = session.user.id;

  // --- شروع تغییرات کلیدی برای دسترسی ادمین ---

  // ۱. ابتدا خود دوره را واکشی می‌کنیم تا مالک آن را پیدا کنیم
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
                },
              },
            },
          },
        },
      },
    },
  });

  if (!learningPathData) return redirect("/");

  // ۲. بررسی می‌کنیم که آیا کاربر فعلی، مالک دوره است؟
  const isOwner = learningPathData.userId === userId;

  // ۳. اگر مالک نبود، آنگاه وضعیت ثبت‌نام را بررسی می‌کنیم
  if (!isOwner) {
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_learningPathId: {
          userId,
          learningPathId,
        },
      },
    });

    // ۴. اگر مالک نبود و ثبت‌نام هم نکرده بود، او را هدایت می‌کنیم
    if (!enrollment) {
      return redirect("/courses");
    }
  }
  // --- پایان تغییرات کلیدی ---

  // اگر کاربر مالک باشد یا ثبت‌نام کرده باشد، به اینجا می‌رسد
  const progressCount = await getProgress(userId, learningPathData.id);

  return (
    <CoursePlayerLayout
      learningPath={learningPathData}
      progressCount={progressCount}
    >
      {children}
    </CoursePlayerLayout>
  );
}