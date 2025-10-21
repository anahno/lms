"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// این اکشن وظیفه ساخت آزمون و هدایت کاربر را بر عهده دارد
export const createQuizAndNavigate = async (
    learningPathId: string,
    chapterId: string,
    sectionId: string,
    title: string
) => {
    try {
        // برای اطمینان، چک می‌کنیم که آزمون از قبل وجود نداشته باشد
        const existingQuiz = await db.quiz.findUnique({
            where: { sectionId },
        });

        // اگر آزمون وجود داشت، فقط کاربر را به صفحه آن هدایت می‌کنیم
        if (existingQuiz) {
            redirect(`/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}/quiz`);
            return; // پایان اجرا
        }

        // ایجاد آزمون جدید در دیتابیس
        await db.quiz.create({
            data: {
                title,
                sectionId,
            },
        });

        // (اختیاری ولی خوب است) کش صفحه بخش را revalidate می‌کنیم
        revalidatePath(`/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}`);

    } catch (error) {
        console.error("[CREATE_QUIZ_ACTION_ERROR]", error);
        // در صورت بروز خطا، یک آبجکت خطا برمی‌گردانیم تا در کلاینت نمایش داده شود
        return { error: "خطایی در هنگام ایجاد آزمون در سرور رخ داد." };
    }

    // پس از موفقیت کامل، کاربر را به صفحه مدیریت آزمون هدایت می‌کنیم
    // این redirect در سمت سرور اتفاق می‌افتد و قطعی است
    redirect(`/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}/quiz`);
};