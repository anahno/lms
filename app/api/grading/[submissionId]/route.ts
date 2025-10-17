// فایل: app/api/grading/[submissionId]/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubmissionStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ submissionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "INSTRUCTOR")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { submissionId } = await context.params;
    const grades = await req.json();

    const userRole = session.user.role;
    const userId = session.user.id;

    const submission = await db.quizSubmission.findUnique({
      where: {
        id: submissionId,
        quiz: {
          section: { chapter: { level: { learningPath: userRole === "INSTRUCTOR" ? { userId: userId } : {}, }, }, },
        },
      },
      include: { answers: true, quiz: { include: { questions: true, }, }, },
    });

    if (!submission) {
      return new NextResponse("آزمون یافت نشد یا دسترسی غیرمجاز است", { status: 404 });
    }
    
    // --- شروع تغییر کلیدی و اصولی ---
    // از روش تابع callback برای تراکنش استفاده می‌کنیم
    await db.$transaction(async (prisma) => {
      for (const questionId of Object.keys(grades)) {
        const userAnswer = submission.answers.find(a => a.questionId === questionId);
        if (!userAnswer) continue; // اگر پاسخی نبود، به سوال بعدی برو

        const grade = grades[questionId];
        const score = parseFloat(grade.score);

        await prisma.userAnswer.update({
          where: { id: userAnswer.id },
          data: {
            score: isNaN(score) ? 0 : score,
            feedback: grade.feedback,
            isCorrect: score > 0,
          },
        });
      }
    });
    // --- پایان تغییر کلیدی و اصولی ---

    const updatedAnswers = await db.userAnswer.findMany({
        where: { submissionId: submissionId }
    });

    let totalPoints = 0;
    let earnedPoints = 0;

    for (const question of submission.quiz.questions) {
        totalPoints += question.points;
        const answer = updatedAnswers.find(a => a.questionId === question.id);
        if (answer && answer.score) {
            earnedPoints += answer.score;
        }
    }
    
    const finalScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    const finalSubmission = await db.quizSubmission.update({
        where: { id: submissionId },
        data: {
            score: finalScore,
            status: SubmissionStatus.GRADED
        }
    });

    return NextResponse.json(finalSubmission);

  } catch (error) {
    console.error("[GRADING_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}