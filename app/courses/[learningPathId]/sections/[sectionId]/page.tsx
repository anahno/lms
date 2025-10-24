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
  // +++ ۱. نوع پراپ params را به Promise تغییر می‌دهیم +++
  params: Promise<{ learningPathId: string; sectionId: string }>;
}) {
  const session = await getServerSession(authOptions);
  
  // +++ ۲. قبل از استفاده، params را await می‌کنیم +++
  const { learningPathId, sectionId } = await params;

  const userId = session?.user?.id;

  const [learningPath, section] = await Promise.all([
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
        chapter: {
          select: {
            isFree: true,
          }
        }
      },
    }),
  ]);

  if (!learningPath || !section || !section.chapter) {
    return redirect("/");
  }

  const isSectionFree = section.isFree;
  const isChapterFree = section.chapter.isFree;
  const isContentFree = isSectionFree || isChapterFree;

  let isEnrolled = false;
  if (userId) {
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_learningPathId: {
          userId,
          learningPathId,
        },
      },
    });
    isEnrolled = !!enrollment;
  }
  
  const canViewContent = isEnrolled || isContentFree;

  if (!canViewContent) {
    // اگر کاربر وارد نشده و محتوا رایگان نیست، به صفحه لاگین با ریدایرکت هدایت شود
    if (!userId) {
      return redirect(`/login?callbackUrl=/courses/${learningPathId}/sections/${sectionId}`);
    }
    // اگر کاربر وارد شده ولی ثبت‌نام نکرده، محتوای قفل شده نمایش داده شود
    return <LockedContent courseId={learningPath.id} />;
  }

  const sectionWithProgress = await db.section.findUnique({
    where: { id: sectionId },
    include: {
      progress: {
        where: { userId },
      },
    },
  });

  if (!sectionWithProgress) {
    return redirect("/");
  }
  
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

  const isCompleted = !!sectionWithProgress.progress && sectionWithProgress.progress.length > 0 && sectionWithProgress.progress[0].isCompleted;

  return (
    <CoursePlayerPage
      learningPath={learningPath}
      section={sectionWithProgress}
      nextSectionId={nextSection?.id}
      isCompleted={isCompleted}
    />
  );
}