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
        status: "PUBLISHED", // خود دوره باید منتشر شده باشد
      },
      // --- شروع اصلاح نهایی و قطعی ---
      // فیلد slug از داخل include حذف شد.
      // پریزما به صورت خودکار تمام فیلدهای اصلی (scalar) مانند slug را باز می‌گرداند.
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
      // --- پایان اصلاح نهایی و قطعی ---
    });

    if (!learningPath) {
      return { error: "دوره یافت نشد یا هنوز منتشر نشده است." };
    }

    // پیدا کردن اولین بخش در ساختار تودرتو
    const firstSection = learningPath.levels?.[0]?.chapters?.[0]?.sections?.[0];

    if (!firstSection) {
      return { error: "این دوره هنوز محتوای قابل مشاهده‌ای ندارد." };
    }

    // در صورت موفقیت، URL را با استفاده از slug دوره و id بخش می‌سازیم
    return { url: `/courses/${learningPath.slug}/sections/${firstSection.id}` };

  } catch (error) {
    console.error("[GET_COURSE_ENTRY_URL_ERROR]", error);
    return { error: "خطای سرور. لطفاً دوباره تلاش کنید." };
  }
};