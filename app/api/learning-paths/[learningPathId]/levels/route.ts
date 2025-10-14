// فایل: app/api/learning-paths/[learningPathId]/levels/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  // --- تغییر در اینجا ---
  context: { params: Promise<{ learningPathId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // --- و تغییر در اینجا (اضافه شدن await) ---
    const { learningPathId } = await context.params;
    const { title } = await req.json();

    if (!title) {
        return new NextResponse("Title is required", { status: 400 });
    }

    // بررسی مالکیت مسیر یادگیری
    const learningPathOwner = await db.learningPath.findUnique({
      where: {
        id: learningPathId,
        userId: session.user.id,
      },
    });

    if (!learningPathOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }

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