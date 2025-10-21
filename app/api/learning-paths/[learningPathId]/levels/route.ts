// فایل: app/api/learning-paths/[learningPathId]/levels/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client"; // ۱. Role را وارد کنید

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { learningPathId } = await context.params;
    const { title } = await req.json();

    if (!title) {
        return new NextResponse("Title is required", { status: 400 });
    }

    // ===== شروع الگوی جدید بررسی دسترسی =====
    const learningPath = await db.learningPath.findUnique({
      where: { id: learningPathId },
    });
    if (!learningPath) {
      return new NextResponse("Learning Path not found", { status: 404 });
    }

    const isOwner = learningPath.userId === session.user.id;
    const isAdmin = session.user.role === Role.ADMIN;
    if (!isOwner && !isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    // ===== پایان الگوی جدید بررسی دسترسی =====

    // پیدا کردن آخرین سطح برای تعیین position جدید
    const lastLevel = await db.level.findFirst({
      where: {
        learningPathId: learningPathId,
      },
      orderBy: {
        position: "desc",
      },
    });

    const newPosition = lastLevel ? lastLevel.position + 1 : 1;

    // ایجاد سطح جدید در دیتابیس
    const level = await db.level.create({
      data: {
        title,
        learningPathId: learningPathId,
        position: newPosition,
      },
    });

    return NextResponse.json(level);

  } catch (error) {
    console.error("[LEVELS_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}