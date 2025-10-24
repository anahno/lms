// فایل: app/courses/[learningPathId]/sections/[sectionId]/page.tsx
"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { CoursePlayerPage } from "@/app/courses/_components/CoursePlayerPage";
import { LockedContent } from "@/app/courses/_components/LockedContent";

export default async function SectionIdPageWrapper({
  params,
}: {
  params: Promise<{ learningPathId: string; sectionId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    // در صورت لاگین نبودن، کاربر را به صفحه لاگین با ریدایرکت به همین دوره هدایت می‌کنیم
    return redirect(`/login?callbackUrl=/courses/${(await params).learningPathId}`);
  }
  const userId = session.user.id;

  const { learningPathId, sectionId } = await params;

  const [learningPath, section, enrollment] = await Promise.all([
    db.learningPath.findUnique({
      where: {
        id: learningPathId,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        description: true,
        whatYouWillLearn: true,
        requirements: true,
        price: true,
      },
    }),
    db.section.findUnique({
      where: {
        id: sectionId,
        isPublished: true,
      },
      include: {
        progress: {
          where: { userId },
        },
        // +++ ۱. اطلاعات فصل والد را هم واکشی می‌کنیم +++
        chapter: {
          select: {
            isFree: true,
          }
        }
      },
    }),
    db.enrollment.findUnique({
      where: {
        userId_learningPathId: {
          userId,
          learningPathId,
        },
      },
    }),
  ]);

  if (!learningPath || !section || !section.chapter) {
    return redirect("/");
  }

  // +++ ۲. منطق نهایی برای بررسی دسترسی +++
  const isEnrolled = !!enrollment;
  const isSectionFree = section.isFree;
  const isChapterFree = section.chapter.isFree;
  const canViewContent = isEnrolled || isSectionFree || isChapterFree;

  if (!canViewContent) {
    return <LockedContent courseId={learningPath.id} />;
  }

  // ... بقیه کد بدون تغییر ...
  const allSectionsInOrder = await db.section.findMany({
    where: {
      chapter: {
        level: { learningPathId: learningPathId },
        isPublished: true,
      },
      isPublished: true,
    },
    orderBy: [
      { chapter: { level: { position: "asc" } } },
      { chapter: { position: "asc" } },
      { position: "asc" },
    ],
    select: { id: true },
  });

  const currentSectionIndex = allSectionsInOrder.findIndex(s => s.id === sectionId);
  const nextSection = allSectionsInOrder[currentSectionIndex + 1];

  const isCompleted = !!section.progress && section.progress.length > 0 && section.progress[0].isCompleted;

  return (
    <CoursePlayerPage
      learningPath={learningPath}
      section={section}
      nextSectionId={nextSection?.id}
      isCompleted={isCompleted}
    />
  );
}