// فایل: actions/rate-section.ts
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const rateSection = async (
  sectionId: string,
  learningPathId: string,
  rating: number
) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "برای امتیازدهی باید وارد شوید." };
    }
    const userId = session.user.id;

    if (rating < 1 || rating > 5) {
      return { error: "امتیاز نامعتبر است." };
    }

    // +++ شروع تغییر اصلی +++
    // ابتدا رکورد پیشرفت کاربر را پیدا می‌کنیم
    const userProgress = await db.userProgress.findUnique({
      where: {
        userId_sectionId: {
          userId: userId,
          sectionId: sectionId,
        },
      },
    });

    // اگر کاربر درس را تکمیل نکرده باشد، اجازه امتیازدهی نده
    if (!userProgress || !userProgress.isCompleted) {
      return { error: "شما باید ابتدا این درس را تکمیل کنید." };
    }

    // اگر کاربر قبلاً امتیاز داده باشد، اجازه تغییر نده
    if (userProgress.rating !== null) {
      return { error: "شما قبلا به این درس امتیاز داده‌اید." };
    }

    // حالا که مطمئن شدیم همه چیز درست است، امتیاز را آپدیت می‌کنیم
    await db.userProgress.update({
      where: {
        id: userProgress.id,
      },
      data: {
        rating: rating,
      },
    });
    // +++ پایان تغییر اصلی +++

    revalidatePath(`/courses/${learningPathId}/sections/${sectionId}`);

    return { success: "امتیاز شما با موفقیت ثبت شد!" };

  } catch (error) {
    console.error("[RATE_SECTION_ERROR]", error);
    return { error: "خطایی در ثبت امتیاز رخ داد." };
  }
};