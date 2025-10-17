// فایل: app/api/courses/[learningPathId]/quiz/[quizId]/submit/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

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
    const { answers } = await req.json(); // answers is like { questionId: optionId, ... }

    // واکشی آزمون به همراه سوالات و گزینه‌های صحیح از دیتابیس
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
    const userAnswersToCreate: { questionId: string; selectedOptionId: string; isCorrect: boolean; score: number }[] = [];

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const correctOption = question.options.find(opt => opt.isCorrect);
      const userAnswerOptionId = answers[question.id];
      const isCorrect = correctOption?.id === userAnswerOptionId;

      if (isCorrect) {
        earnedPoints += question.points;
      }
      
      if (userAnswerOptionId) {
        userAnswersToCreate.push({
          questionId: question.id,
          selectedOptionId: userAnswerOptionId,
          isCorrect: isCorrect,
          score: isCorrect ? question.points : 0,
        });
      }
    }

    const finalScore = (earnedPoints / totalPoints) * 100;

    // ذخیره نتایج در یک تراکنش
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