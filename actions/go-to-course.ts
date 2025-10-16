// فایل: actions/go-to-course.ts
"use server";

import { db } from "@/lib/db";

// این تابع ID مسیر یادگیری را گرفته و URL اولین بخش قابل مشاهده را برمی‌گرداند
export const getCourseEntryUrl = async (learningPathId: string) => {
  try {
    // مسیر یادگیری را به همراه کل ساختار "منتشر شده" آن پیدا می‌کنیم
    const learningPath = await db.learningPath.findUnique({
      where: {
        id: learningPathId,
        // --- تغییر کلیدی در اینجا ---
        status: "PUBLISHED", // خود دوره باید منتشر شده باشد
      },
      include: {
        levels: {
          orderBy: { position: "asc" }, // اولین سطح
          include: {
            chapters: {
              where: { isPublished: true },
              orderBy: { position: "asc" }, // اولین فصل
              include: {
                sections: {
                  where: { isPublished: true },
                  orderBy: { position: "asc" }, // اولین بخش
                },
              },
            },
          },
        },
      },
    });

    if (!learningPath) {
      return { error: "دوره یافت نشد یا هنوز منتشر نشده است." };
    }

    // پیدا کردن اولین بخش در ساختار تودرتو
    const firstSection = learningPath.levels?.[0]?.chapters?.[0]?.sections?.[0];

    if (!firstSection) {
      return { error: "این دوره هنوز محتوای قابل مشاهده‌ای ندارد." };
    }

    // در صورت موفقیت، URL را برمی‌گردانیم
    return { url: `/courses/${learningPathId}/sections/${firstSection.id}` };

  } catch (error) {
    console.error("[GET_COURSE_ENTRY_URL_ERROR]", error);
    return { error: "خطای سرور. لطفاً دوباره تلاش کنید." };
  }
};