// فایل: app/api/learning-paths/[learningPathId]/chapters/[chapterId]/sections/[sectionId]/quiz/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client"; // ۱. Role را وارد کنید

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
    const { title } = await req.json();

    // ===== شروع الگوی جدید بررسی دسترسی =====
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
    // ===== پایان الگوی جدید بررسی دسترسی =====

    // بررسی اینکه آیا این بخش قبلا آزمون داشته یا نه
    const existingQuiz = await db.quiz.findUnique({
      where: { sectionId },
    });
    if (existingQuiz) {
      return new NextResponse("این بخش قبلاً یک آزمون دارد", { status: 400 });
    }

    // ایجاد آزمون جدید و اتصال آن به بخش مورد نظر
    const quiz = await db.quiz.create({
      data: {
        title,
        sectionId,
      },
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("[QUIZ_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}