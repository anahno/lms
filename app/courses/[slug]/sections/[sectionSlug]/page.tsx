// فایل: app/courses/[slug]/sections/[sectionSlug]/page.tsx
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
  // --- ۱. پارامترها به slug و sectionSlug تغییر کردند ---
  params: Promise<{ slug: string; sectionSlug: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { slug, sectionSlug } = await params;
  const userId = session?.user?.id;

  // --- ۲. دوره را بر اساس slug واکشی می‌کنیم ---
  const learningPath = await db.learningPath.findUnique({
    where: {
      slug: slug,
      status: 'PUBLISHED',
    },
    // select فقط برای گرفتن ID و title و سایر اطلاعات لازم
    select: {
      id: true, // ID را برای کوئری‌های بعدی نیاز داریم
      title: true,
      subtitle: true,
      description: true,
      whatYouWillLearn: true,
      requirements: true,
      price: true,
    },
  });
  
  if (!learningPath) {
    return redirect("/");
  }

  // --- ۳. بخش را بر اساس ID آن (sectionSlug) واکشی می‌کنیم ---
  const section = await db.section.findUnique({
    where: {
      id: sectionSlug,
      isPublished: true,
      chapter: {
        level: {
          learningPathId: learningPath.id // از ID دوره برای اطمینان از صحت استفاده می‌کنیم
        }
      }
    },
    include: {
      progress: {
        where: { userId },
      },
      chapter: {
        select: {
          isFree: true,
        }
      }
    },
  });
  
  if (!section || !section.chapter) {
    return redirect(`/courses/${slug}`); // اگر بخش یافت نشد به صفحه معرفی دوره برگرد
  }

  // منطق کنترل دسترسی بدون تغییر باقی می‌ماند
  let isEnrolled = false;
  if (userId) {
    const enrollment = await db.enrollment.findUnique({
      where: { userId_learningPathId: { userId, learningPathId: learningPath.id } },
    });
    isEnrolled = !!enrollment;
  }

  const canViewContent = isEnrolled || section.isFree || section.chapter.isFree;

  if (!canViewContent) {
    if (!userId) {
      return redirect(`/login?callbackUrl=/courses/${slug}/sections/${sectionSlug}`);
    }
    return <LockedContent courseId={learningPath.id} />;
  }

  // پیدا کردن بخش بعدی برای دکمه "درس بعدی"
  const allSectionsInOrder = await db.section.findMany({
    where: {
      chapter: {
        level: { learningPathId: learningPath.id },
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

  const currentSectionIndex = allSectionsInOrder.findIndex(s => s.id === sectionSlug);
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