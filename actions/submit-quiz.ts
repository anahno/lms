// فایل: actions/submit-quiz.ts
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// این تایپ‌ها به ما کمک می‌کنند تا با ساختار JSON آزمون کار کنیم
type QuizData = {
  isQuiz: boolean;
  questions: {
    id: string;
    text: string;
    options: { id: string; text: string }[];
    correctOptionId: string;
  }[];
};

type UserAnswers = Record<string, string>; // فرمت پاسخ‌های دانشجو

export const submitQuiz = async (
  quizSectionId: string,
  userAnswers: UserAnswers
) => {
  console.log(`[SUBMIT_QUIZ_START] Processing quiz for Section ID: ${quizSectionId}`);

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "برای ثبت آزمون باید وارد شوید." };
    }
    const userId = session.user.id;

    const quizSection = await db.section.findUnique({
      where: { id: quizSectionId },
    });

    if (!quizSection?.description) {
      return { error: "اطلاعات آزمون یافت نشد." };
    }

    let quizData: QuizData;
    try {
      quizData = JSON.parse(quizSection.description);
    } catch (e) {
      console.error("[SUBMIT_QUIZ_ERROR] Invalid JSON in section description:", quizSection.description);
      return { error: "ساختار آزمون نامعتبر است." };
    }
    
    if (!quizData.isQuiz || !quizData.questions) {
      return { error: "این بخش یک آزمون معتبر نیست." };
    }

    const totalQuestions = quizData.questions.length;
    if (totalQuestions === 0) {
        return { success: true, score: 0 }; // اگر آزمون سوالی نداشت، نمره صفر ثبت کن
    }
    
    let correctAnswers = 0;
    quizData.questions.forEach(question => {
      if (userAnswers[question.id] === question.correctOptionId) {
        correctAnswers++;
      }
    });

    const scorePercentage = (correctAnswers / totalQuestions) * 100;
    
    console.log(`[SUBMIT_QUIZ_CALC] Score calculated: ${scorePercentage}% (${correctAnswers}/${totalQuestions})`);

    await db.userProgress.upsert({
      where: {
        userId_sectionId: {
          userId,
          sectionId: quizSectionId,
        },
      },
      update: {
        isCompleted: true,
        score: scorePercentage, // <--- مهم‌ترین بخش: ثبت نمره
      },
      create: {
        userId,
        sectionId: quizSectionId,
        isCompleted: true,
        score: scorePercentage, // <--- مهم‌ترین بخش: ثبت نمره
      },
    });

    console.log(`[SUBMIT_QUIZ_DB_SUCCESS] Score for user ${userId} saved successfully.`);

    return {
      success: "آزمون شما با موفقیت ثبت شد!",
      score: scorePercentage,
    };

  } catch (error) {
    console.error("[SUBMIT_QUIZ_FATAL_ERROR]", error);
    return { error: "خطایی غیرمنتظره در سرور رخ داد." };
  }
};