// فایل: app/api/learning-paths/[learningPathId]/chapters/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
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
    const { title, levelId } = await req.json();

    if (!title) {
        return new NextResponse("Title is required", { status: 400 });
    }
    if (!levelId) {
        return new NextResponse("Level ID is required", { status: 400 });
    }

    // بررسی مالکیت مسیر یادگیری والد
    const courseOwner = await db.learningPath.findUnique({
      where: { id: learningPathId, userId: session.user.id },
    });
    if (!courseOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // بررسی اضافه: اطمینان از اینکه levelId متعلق به همین مسیر یادگیری است
    const levelOwner = await db.level.findUnique({
        where: {
            id: levelId,
            learningPathId: learningPathId,
        }
    });
    if (!levelOwner) {
        return new NextResponse("Level not found in this learning path", { status: 404 });
    }

    // آخرین فصل را در *سطح مشخص شده* پیدا می‌کنیم
    const lastChapter = await db.chapter.findFirst({
      where: { levelId: levelId }, 
      orderBy: { position: "desc" },
    });
    
    const newPosition = lastChapter ? lastChapter.position + 1 : 1;

    // فصل را با levelId ایجاد می‌کنیم
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