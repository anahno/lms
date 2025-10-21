// فایل: app/api/learning-paths/[learningPathId]/chapters/[chapterId]/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

// تابع ویرایش
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string; chapterId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { learningPathId, chapterId } = await context.params;
    const values = await req.json();

    // الگوی جدید بررسی دسترسی
    const learningPath = await db.learningPath.findUnique({
      where: { id: learningPathId },
    });
    if (!learningPath) return new NextResponse("Not Found", { status: 404 });

    const isOwner = learningPath.userId === session.user.id;
    const isAdmin = session.user.role === Role.ADMIN;
    if (!isOwner && !isAdmin) return new NextResponse("Forbidden", { status: 403 });

    // اجرای عملیات
    const chapter = await db.chapter.update({
      where: { id: chapterId, level: { learningPathId: learningPathId } }, // اطمینان از اینکه فصل متعلق به همین دوره است
      data: { ...values },
    });

    return NextResponse.json(chapter);

  } catch (error) {
    console.error("[CHAPTER_ID_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// تابع حذف
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string; chapterId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { learningPathId, chapterId } = await context.params;
    
    // الگوی جدید بررسی دسترسی
    const learningPath = await db.learningPath.findUnique({
      where: { id: learningPathId },
    });
    if (!learningPath) return new NextResponse("Not Found", { status: 404 });

    const isOwner = learningPath.userId === session.user.id;
    const isAdmin = session.user.role === Role.ADMIN;
    if (!isOwner && !isAdmin) return new NextResponse("Forbidden", { status: 403 });

    // اجرای عملیات
    const deletedChapter = await db.chapter.delete({
      where: { id: chapterId },
    });

    return NextResponse.json(deletedChapter);

  } catch (error) {
    console.error("[CHAPTER_ID_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}