// فایل: actions/progress.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ۱. --- تغییر نام تابع و پارامترها ---
// chapterId به sectionId تغییر کرده است
export const toggleSectionCompletion = async (
  sectionId: string,
  learningPathId: string, // این را برای revalidate کردن مسیر نیاز داریم
  isCompleted: boolean
) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const userId = session.user.id;

    // ۲. --- تغییر کلیدی در اینجا ---
    // از upsert برای ایجاد یا به‌روزرسانی پیشرفت "بخش" استفاده می‌کنیم.
    // کلید منحصر به فرد حالا userId_sectionId است.
    await db.userProgress.upsert({
      where: {
        userId_sectionId: { // استفاده از کلید ترکیبی جدید
          userId,
          sectionId,
        },
      },
      update: {
        isCompleted: !isCompleted,
      },
      create: {
        userId,
        sectionId, // ذخیره sectionId به جای chapterId
        isCompleted: true,
      },
    });

    // ۳. --- به‌روزرسانی revalidatePath ---
    // باید مسیر صفحه دوره دانشجو را revalidate کنیم تا پیشرفت جدید نمایش داده شود.
    // آدرس این صفحه را باید متناسب با ساختار جدیدتان تنظیم کنید.
    // فرض می‌کنیم که ساختار URL برای مشاهده دوره به شکل زیر است:
    // /courses/[learningPathId]/sections/[sectionId]
    // اگر ساختار دیگری دارید، این آدرس را تغییر دهید.
    revalidatePath(`/courses/${learningPathId}`); // revalidate کردن کل دوره
    
    return { success: true };

  } catch (error) {
    console.error("[TOGGLE_SECTION_COMPLETION_ERROR]", error);
    return { success: false, error: "Something went wrong" };
  }
};