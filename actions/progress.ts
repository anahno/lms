// فایل: actions/progress.ts
"use server"; // این خط این فایل را به یک Server Action Module تبدیل می‌کند

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const toggleChapterCompletion = async (
  chapterId: string,
  learningPathId: string,
  isCompleted: boolean
) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const userId = session.user.id;

    // از upsert استفاده می‌کنیم: اگر رکوردی وجود داشت، آن را آپدیت کن؛
    // اگر وجود نداشت، آن را ایجاد کن.
    await db.userProgress.upsert({
      where: {
        userId_chapterId: {
          userId,
          chapterId,
        },
      },
      update: {
        isCompleted: !isCompleted,
      },
      create: {
        userId,
        chapterId,
        isCompleted: true,
      },
    });

    // به Next.js می‌گوییم که کش این مسیر را پاک کند تا داده‌های جدید را دریافت کند
    revalidatePath(`/courses/${learningPathId}/chapters/${chapterId}`);
    
    return { success: true };

  } catch (error) {
    console.error("[TOGGLE_CHAPTER_COMPLETION_ERROR]", error);
    return { success: false, error: "Something went wrong" };
  }
};