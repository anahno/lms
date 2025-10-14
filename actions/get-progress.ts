// فایل: actions/get-progress.ts
"use server";

import { db } from "@/lib/db";

export const getProgress = async (
  userId: string,
  learningPathId: string
): Promise<number> => {
  try {
    // ۱. تمام "بخش‌"های منتشر شده در یک مسیر یادگیری مشخص را پیدا می‌کنیم.
    // این کار با پیمایش روابط انجام می‌شود: Section -> Chapter -> Level -> LearningPath
    const publishedSections = await db.section.findMany({
      where: {
        isPublished: true, // خود بخش باید منتشر شده باشد
        chapter: {
          isPublished: true, // فصل والد آن هم باید منتشر شده باشد
          level: {
            learningPathId: learningPathId, // و سطح والد آن باید متعلق به این مسیر یادگیری باشد
          },
        },
      },
      select: {
        id: true, // فقط ID ها را نیاز داریم
      },
    });

    // ۲. آرایه‌ای از ID های بخش‌های قابل شمارش می‌سازیم
    const publishedSectionIds = publishedSections.map((section) => section.id);
    
    // اگر هیچ بخش منتشر شده‌ای وجود نداشت، پیشرفت صفر است
    if (publishedSectionIds.length === 0) {
        return 0;
    }

    // ۳. تعداد بخش‌هایی که کاربر از لیست بالا تکمیل کرده را می‌شماریم
    const validCompletedSections = await db.userProgress.count({
      where: {
        userId: userId,
        sectionId: { // پیشرفت بر اساس sectionId است
          in: publishedSectionIds,
        },
        isCompleted: true,
      },
    });

    // ۴. درصد پیشرفت را محاسبه می‌کنیم
    const progressPercentage = (validCompletedSections / publishedSectionIds.length) * 100;
    
    return progressPercentage;

  } catch (error) {
    console.log("[GET_PROGRESS_ERROR]", error);
    return 0;
  }
};