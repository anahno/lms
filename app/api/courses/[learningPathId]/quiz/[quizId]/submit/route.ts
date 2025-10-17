// فایل: app/api/courses/[learningPathId]/quiz/[quizId]/submit/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { QuestionType } from "@prisma/client";

type SubmissionPayload = {
  questionId: string;
  selectedOptionId?: string;
  selectedOptionIds?: string[];
  textAnswer?: string; // ۱. فیلد پاسخ متنی را اضافه می‌کنیم
};

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    const { quizId } = await context.params;
    const { answers } = await req.json();

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    if (!quiz) {
      return new NextResponse("آزمون یافت نشد", { status: 404 });
    }

    let totalPoints = 0;
    let earnedPoints = 0;
    const userAnswersToCreate: (SubmissionPayload & { isCorrect: boolean; score: number })[] = [];

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const userAnswer = answers[question.id];
      let isCorrect = false;
      
      const submissionPayload: SubmissionPayload = { questionId: question.id };

      if (question.type === QuestionType.SINGLE_CHOICE) {
        const correctOption = question.options.find(opt => opt.isCorrect);
        isCorrect = correctOption?.id === userAnswer;
        if (userAnswer) submissionPayload.selectedOptionId = userAnswer;
      } 
      else if (question.type === QuestionType.MULTIPLE_CHOICE) {
        const correctOptionIds = question.options.filter(opt => opt.isCorrect).map(opt => opt.id).sort();
        const userAnswersArray = (Array.isArray(userAnswer) ? userAnswer : []).sort();
        if (userAnswersArray.length === correctOptionIds.length && JSON.stringify(userAnswersArray) === JSON.stringify(correctOptionIds)) {
          isCorrect = true;
        }
        if (userAnswersArray.length > 0) submissionPayload.selectedOptionIds = userAnswersArray;
      }
      // ۲. منطق جدید برای تصحیح سوالات جای خالی
      else if (question.type === QuestionType.FILL_IN_THE_BLANK) {
        const correctAnswer = question.options.find(opt => opt.isCorrect)?.text;
        if (typeof userAnswer === 'string' && correctAnswer) {
            // مقایسه با حذف فاصله‌های اضافی و تبدیل به حروف کوچک
            isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
        }
        if (typeof userAnswer === 'string') submissionPayload.textAnswer = userAnswer;
      }

      if (isCorrect) {
        earnedPoints += question.points;
      }
      
      // پاسخ‌های خالی یا تعریف نشده را ثبت نمی‌کنیم
      if (userAnswer && ( (Array.isArray(userAnswer) && userAnswer.length > 0) || !Array.isArray(userAnswer) )) {
          userAnswersToCreate.push({
              ...submissionPayload,
              isCorrect: isCorrect,
              score: isCorrect ? question.points : 0,
          });
      }
    }

    const finalScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    // قبلا یک باگ در اینجا وجود داشت که نتیجه را برنمی‌گرداندیم، اصلاح شد
    const submission = await db.quizSubmission.create({
      data: {
        userId,
        quizId,
        score: finalScore,
        status: "GRADED",
        answers: {
          create: userAnswersToCreate,
        },
      },
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error("[QUIZ_SUBMIT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}