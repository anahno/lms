// فایل: actions/enroll-course.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// +++ ۱. اکشن بررسی نشان‌ها را وارد می‌کنیم +++
import { checkAndAwardBadges } from "./gamification-actions";

export const enrollInCourse = async (learningPathId: string) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "برای ثبت‌نام ابتدا باید وارد شوید." };
    }
    const userId = session.user.id;

    // ۱. بررسی اینکه دوره وجود دارد و منتشر شده است
    const learningPath = await db.learningPath.findUnique({
      where: {
        id: learningPathId,
      },
    });

    // ۲. بررسی وضعیت دوره پس از واکشی
    if (!learningPath || learningPath.status !== 'PUBLISHED') {
      return { error: "دوره یافت نشد یا هنوز منتشر نشده است." };
    }

    // ۳. بررسی اینکه کاربر قبلاً در این دوره ثبت‌نام نکرده باشد
    const existingEnrollment = await db.enrollment.findUnique({
      where: {
        userId_learningPathId: {
          userId,
          learningPathId,
        },
      },
    });

    if (existingEnrollment) {
      return { error: "شما قبلاً در این دوره ثبت‌نام کرده‌اید." };
    }

    // ۴. ایجاد رکورد ثبت‌نام
    await db.enrollment.create({
      data: {
        userId,
        learningPathId,
      },
    });

    // +++ ۲. پس از ثبت‌نام موفق، شرایط دریافت نشان‌ها را بررسی می‌کنیم +++
    await checkAndAwardBadges(userId);

    // ۵. revalidate کردن صفحات مرتبط برای نمایش تغییرات
    revalidatePath(`/courses`);
    revalidatePath(`/courses/${learningPathId}`);
    
    return { success: "ثبت‌نام شما با موفقیت انجام شد!" };

  } catch (error) {
    console.error("[ENROLL_COURSE_ERROR]", error);
    return { error: "خطایی در هنگام ثبت‌نام رخ داد. لطفاً دوباره تلاش کنید." };
  }
};