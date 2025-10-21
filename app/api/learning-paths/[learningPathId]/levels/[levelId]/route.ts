// فایل: app/api/learning-paths/[learningPathId]/levels/[levelId]/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client"; // ۱. Role را وارد کنید

// تابع برای ویرایش (مثلا تغییر عنوان)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string; levelId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { learningPathId, levelId } = await context.params;
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

    // اجرای عملیات ویرایش
    const updatedLevel = await db.level.update({
      where: {
        id: levelId,
        learningPathId: learningPathId,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(updatedLevel);

  } catch (error) {
    console.error("[LEVEL_ID_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// تابع برای حذف
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string; levelId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { learningPathId, levelId } = await context.params;
    
    // ===== شروع الگوی جدید بررسی دسترسی =====
    const learningPath = await db.learningPath.findUnique({
        where: { id: learningPathId },
    });
    if (!learningPath) return new NextResponse("Not Found", { status: 404 });

    const isOwner = learningPath.userId === session.user.id;
    const isAdmin = session.user.role === Role.ADMIN;
    if (!isOwner && !isAdmin) return new NextResponse("Forbidden", { status: 403 });
    // ===== پایان الگوی جدید بررسی دسترسی =====
    
    // اجرای عملیات حذف
    const deletedLevel = await db.level.delete({
      where: {
        id: levelId,
        learningPathId: learningPathId,
      },
    });

    return NextResponse.json(deletedLevel);

  } catch (error) {
    console.error("[LEVEL_ID_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}