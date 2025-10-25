// فایل: app/api/courses/[learningPathId]/quiz/[quizId]/submit/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { QuestionType, SubmissionStatus } from "@prisma/client";

type SubmissionPayload = {
  questionId: string;
  selectedOptionId?: string;
  selectedOptionIds?: string[];
  textAnswer?: string; // برای ذخیره پاسخ‌های متنی (تشریحی، جای خالی، و JSON سوال کشیدنی)
};

// این نوع برای کار با ساختار متن سوال کشیدنی است
type TextPart = { type: 'text'; content: string } | { type: 'blank'; id: string };

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

    const hasManualGrading = quiz.questions.some(
      q => q.type === QuestionType.ESSAY || q.type === QuestionType.AUDIO_RESPONSE
    );

    let totalPoints = 0;
    let earnedPoints = 0;
    const userAnswersToCreate: (SubmissionPayload & { isCorrect: boolean | null; score: number | null })[] = [];

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const userAnswer = answers[question.id];
      let isCorrect: boolean | null = false;
      let score: number | null = 0;
      
      const submissionPayload: SubmissionPayload = { questionId: question.id };

      if (!userAnswer) continue; // اگر جوابی برای سوال ارسال نشده، از آن بگذر

      // بر اساس نوع سوال، نمره‌دهی را انجام می‌دهیم
      switch (question.type) {
        case QuestionType.ESSAY:
        case QuestionType.AUDIO_RESPONSE:
          isCorrect = null; 
          score = null;     
          if (typeof userAnswer === 'string') submissionPayload.textAnswer = userAnswer;
          break;

        case QuestionType.SINGLE_CHOICE:
          const correctOption = question.options.find(opt => opt.isCorrect);
          isCorrect = correctOption?.id === userAnswer;
          if (userAnswer) submissionPayload.selectedOptionId = userAnswer;
          break;
        
        case QuestionType.MULTIPLE_CHOICE:
          const correctOptionIds = new Set(question.options.filter(opt => opt.isCorrect).map(opt => opt.id));
          const userAnswersArray = new Set(Array.isArray(userAnswer) ? userAnswer : []);
          
          isCorrect = correctOptionIds.size === userAnswersArray.size && [...correctOptionIds].every(id => userAnswersArray.has(id));

          if (userAnswersArray.size > 0) submissionPayload.selectedOptionIds = Array.from(userAnswersArray);
          break;

        case QuestionType.FILL_IN_THE_BLANK:
          const correctAnswerText = question.options.find(opt => opt.isCorrect)?.text;
          if (typeof userAnswer === 'string' && correctAnswerText) {
              isCorrect = userAnswer.trim().toLowerCase() === correctAnswerText.trim().toLowerCase();
          }
          if (typeof userAnswer === 'string') submissionPayload.textAnswer = userAnswer;
          break;

        // +++ شروع منطق نمره‌دهی سوال کشیدن و رها کردن +++
        case QuestionType.DRAG_INTO_TEXT:
          const textParts: TextPart[] = JSON.parse(question.description || '[]');
          const correctOptionsForDrag = question.options.filter(o => o.isCorrect);
          const blankIds = new Set(textParts.filter(p => p.type === 'blank').map(p => (p as {id: string}).id));
          let correctMatches = 0;

          // userAnswer باید یک آبجکت باشد: { 'blank-id': 'option-id', ... }
          if (typeof userAnswer === 'object' && userAnswer !== null && !Array.isArray(userAnswer)) {
              for (const blankId in userAnswer) {
                  if (blankIds.has(blankId)) {
                      const droppedOptionId = (userAnswer as Record<string, string>)[blankId];
                      const isMatchCorrect = correctOptionsForDrag.some(opt => opt.id === droppedOptionId);
                      if (isMatchCorrect) {
                          correctMatches++;
                      }
                  }
              }
          }

          if (correctMatches > 0) {
              const pointsPerBlank = question.points / correctOptionsForDrag.length;
              score = correctMatches * pointsPerBlank;
              earnedPoints += score;
          }
          
          isCorrect = correctMatches === correctOptionsForDrag.length;
          submissionPayload.textAnswer = JSON.stringify(userAnswer);
          break;
        // +++ پایان منطق نمره‌دهی +++
      }
      
      if (isCorrect === true && question.type !== QuestionType.DRAG_INTO_TEXT) {
        earnedPoints += question.points;
        score = question.points;
      }
      
      userAnswersToCreate.push({ ...submissionPayload, isCorrect, score });
    }

    let finalScore: number | null = null;
    let finalStatus: SubmissionStatus = SubmissionStatus.GRADED;

    if (hasManualGrading) {
        finalStatus = SubmissionStatus.SUBMITTED;
        finalScore = null; 
    } else {
        finalScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    }

    const submission = await db.quizSubmission.create({
      data: {
        userId,
        quizId,
        score: finalScore,
        status: finalStatus,
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