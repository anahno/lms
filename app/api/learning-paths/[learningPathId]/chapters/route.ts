// فایل: app/api/learning-paths/[learningPathId]/chapters/route.ts
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
    const { title, levelId } = await req.json();

    if (!title || !levelId) {
        return new NextResponse("Title and Level ID are required", { status: 400 });
    }

    // ===== شروع تغییرات کلیدی =====

    // مرحله ۱: دوره را بدون چک کردن مالکیت پیدا کن
    const learningPath = await db.learningPath.findUnique({
      where: { id: learningPathId },
    });
    if (!learningPath) {
        return new NextResponse("Not Found", { status: 404 });
    }

    // مرحله ۲: دسترسی را چک کن (مالک یا ادمین)
    const isOwner = learningPath.userId === session.user.id;
    const isAdmin = session.user.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // ===== پایان تغییرات کلیدی =====


    // مرحله ۳: اگر دسترسی مجاز بود، عملیات را ادامه بده
    const lastChapter = await db.chapter.findFirst({
      where: { levelId: levelId }, 
      orderBy: { position: "desc" },
    });
    
    const newPosition = lastChapter ? lastChapter.position + 1 : 1;

    const chapter = await db.chapter.create({
      data: {
        title,
        position: newPosition,
        levelId: levelId,
      },
    });

    return NextResponse.json(chapter);

  } catch (error) {
    console.error("[CHAPTERS_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}