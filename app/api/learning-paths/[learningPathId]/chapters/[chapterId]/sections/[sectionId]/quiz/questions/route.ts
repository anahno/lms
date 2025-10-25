// فایل: app/api/learning-paths/[learningPathId]/chapters/[chapterId]/sections/[sectionId]/quiz/questions/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { QuestionType, Role } from "@prisma/client";

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

    const learningPath = await db.learningPath.findUnique({
      where: { id: learningPathId },
    });
    if (!learningPath) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const isOwner = learningPath.userId === session.user.id;
    const isAdmin = session.user.role === Role.ADMIN;
    if (!isOwner && !isAdmin) {
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
    
    // +++ شروع تغییرات +++
    let optionsToCreate: { text: string; isCorrect?: boolean }[] = [];
    let description: string | undefined = undefined;

    if (type === QuestionType.SINGLE_CHOICE || type === QuestionType.MULTIPLE_CHOICE) {
      optionsToCreate = [{ text: "گزینه ۱" }, { text: "گزینه ۲" }];
    } else if (type === QuestionType.FILL_IN_THE_BLANK) {
      optionsToCreate = [{ text: "", isCorrect: true }];
    } 
    else if (type === QuestionType.DRAG_INTO_TEXT) {
      // یک ساختار JSON اولیه برای متن سوال ایجاد می‌کنیم
      description = JSON.stringify([
        { type: "text", content: "این یک متن " },
        { type: "blank", id: `blank-${Date.now()}` }, // از Date.now() برای ID یکتا استفاده می‌کنیم
        { type: "text", content: " برای نمونه است." },
      ]);
      // گزینه‌های اولیه برای کشیدن
      optionsToCreate = [
        { text: "آزمایشی", isCorrect: true }, // یک پاسخ صحیح
        { text: "انحرافی", isCorrect: false }, // یک گزینه انحرافی
      ];
    }
    // +++ پایان تغییرات +++
    
    const question = await db.question.create({
      data: {
        text,
        quizId: quiz.id,
        position: newPosition,
        type: type,
        description, // فیلد جدید برای ذخیره ساختار متن
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