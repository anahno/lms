// فایل: actions/progress.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

import { grantExperiencePoints } from "./gamification-actions";
import { XP_EVENTS } from "@/lib/gamification-rules";


export const toggleSectionCompletion = async (
  sectionId: string,
  learningPathId: string,
  // این پراپرتی به ما وضعیت "قبل" از کلیک را می‌دهد
  isCompleted: boolean 
) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const userId = session.user.id;

    // +++ شروع تغییر اصلی +++

    // ما فقط زمانی امتیاز می‌دهیم که کاربر در حال تغییر وضعیت از "تکمیل نشده" به "تکمیل شده" باشد.
    // یعنی isCompleted (وضعیت قبلی) باید false باشد.
    if (!isCompleted) {
      // این تابع را به صورت async فراخوانی می‌کنیم ولی منتظر جوابش نمی‌مانیم
      // تا کاربر منتظر پردازش امتیازدهی نماند.
      grantExperiencePoints(userId, XP_EVENTS.COMPLETE_SECTION);
    }

    // عملیات دیتابیس برای تغییر وضعیت همیشه انجام می‌شود
    await db.userProgress.upsert({
      where: {
        userId_sectionId: {
          userId,
          sectionId,
        },
      },
      update: {
        isCompleted: !isCompleted,
      },
      create: {
        userId,
        sectionId,
        isCompleted: true, // در زمان ایجاد، همیشه true است
      },
    });
    
    // +++ پایان تغییر اصلی +++
    
    revalidatePath(`/courses/${learningPathId}`);
    
    return { success: true };

  } catch (error) {
    console.error("[TOGGLE_SECTION_COMPLETION_ERROR]", error);
    return { success: false, error: "Something went wrong" };
  }
};