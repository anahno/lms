// فایل: app/api/.../quiz/questions/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { QuestionType } from "@prisma/client";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { learningPathId, sectionId } = await context.params;
    const { text, type = QuestionType.SINGLE_CHOICE } = await req.json();

    const courseOwner = await db.learningPath.findUnique({
      where: { id: learningPathId, userId: session.user.id },
    });
    if (!courseOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const quiz = await db.quiz.findUnique({ where: { sectionId } });
    if (!quiz) {
      return new NextResponse("آزمون یافت نشد", { status: 404 });
    }

    const lastQuestion = await db.question.findFirst({
      where: { quizId: quiz.id },
      orderBy: { position: "desc" },
    });

    const newPosition = lastQuestion ? lastQuestion.position + 1 : 1;
    
    // --- شروع تغییر کلیدی ---
    // نوع متغیر را به صراحت تعریف می‌کنیم
    let optionsToCreate: { text: string; isCorrect?: boolean }[] = [];
    // --- پایان تغییر کلیدی ---

    if (type === QuestionType.SINGLE_CHOICE || type === QuestionType.MULTIPLE_CHOICE) {
      optionsToCreate = [{ text: "گزینه ۱" }, { text: "گزینه ۲" }];
    } else if (type === QuestionType.FILL_IN_THE_BLANK) {
      optionsToCreate = [{ text: "", isCorrect: true }];
    }

    const question = await db.question.create({
      data: {
        text,
        quizId: quiz.id,
        position: newPosition,
        type: type,
        options: {
          create: optionsToCreate,
        },
      },
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error("[QUESTION_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}