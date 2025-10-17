// فایل: app/api/.../quiz/questions/[questionId]/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string; questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
    
    const { learningPathId, questionId } = await context.params;
    const values = await req.json();

    // بررسی مالکیت
    const courseOwner = await db.learningPath.findUnique({
      where: { id: learningPathId, userId: session.user.id },
    });
    if (!courseOwner) return new NextResponse("Forbidden", { status: 403 });

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
    
    // بررسی مالکیت
    const courseOwner = await db.learningPath.findUnique({
      where: { id: learningPathId, userId: session.user.id },
    });
    if (!courseOwner) return new NextResponse("Forbidden", { status: 403 });

    const deletedQuestion = await db.question.delete({
      where: { id: questionId },
    });

    return NextResponse.json(deletedQuestion);
  } catch (error) {
    console.error("[QUESTION_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}