// فایل: app/api/.../quiz/questions/[questionId]/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client"; // ۱. Role را وارد کنید

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string; questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
    
    const { learningPathId, questionId } = await context.params;
    const values = await req.json();

    // ===== شروع الگوی جدید بررسی دسترسی =====
    const learningPath = await db.learningPath.findUnique({
      where: { id: learningPathId },
    });
    if (!learningPath) return new NextResponse("Not Found", { status: 404 });

    const isOwner = learningPath.userId === session.user.id;
    const isAdmin = session.user.role === Role.ADMIN;
    if (!isOwner && !isAdmin) return new NextResponse("Forbidden", { status: 403 });
    // ===== پایان الگوی جدید بررسی دسترسی =====

    // به‌روزرسانی سوال و گزینه‌های آن در یک تراکنش
    const updatedQuestion = await db.$transaction(async (prisma) => {
      const question = await prisma.question.update({
        where: { id: questionId },
        data: {
          text: values.text,
          points: values.points,
        },
      });

      // حذف گزینه‌های قدیمی
      await prisma.option.deleteMany({
        where: { questionId: questionId },
      });

      // ایجاد گزینه‌های جدید
      await prisma.option.createMany({
        data: values.options.map((opt: { text: string; isCorrect: boolean }) => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
          questionId: questionId,
        })),
      });

      return question;
    });

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error("[QUESTION_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string; questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { learningPathId, questionId } = await context.params;
    
    // ===== شروع الگوی جدید بررسی دسترسی =====
    const learningPath = await db.learningPath.findUnique({
      where: { id: learningPathId },
    });
    if (!learningPath) return new NextResponse("Not Found", { status: 404 });

    const isOwner = learningPath.userId === session.user.id;
    const isAdmin = session.user.role === Role.ADMIN;
    if (!isOwner && !isAdmin) return new NextResponse("Forbidden", { status: 403 });
    // ===== پایان الگوی جدید بررسی دسترسی =====

    const deletedQuestion = await db.question.delete({
      where: { id: questionId },
    });

    return NextResponse.json(deletedQuestion);
  } catch (error) {
    console.error("[QUESTION_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}