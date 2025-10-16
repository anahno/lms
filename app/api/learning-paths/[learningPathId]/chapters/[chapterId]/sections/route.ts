// فایل: app/api/learning-paths/[learningPathId]/chapters/[chapterId]/sections/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  // --- تغییر در اینجا ---
  context: { params: Promise<{ learningPathId: string; chapterId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // --- و تغییر در اینجا (اضافه شدن await) ---
    const { learningPathId, chapterId } = await context.params;
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
    
    // اطمینان از اینکه فصل مورد نظر وجود دارد
    const chapter = await db.chapter.findUnique({
        where: {
            id: chapterId,
        }
    });
    if (!chapter) {
        return new NextResponse("Chapter not found", { status: 404 });
    }

    // پیدا کردن آخرین بخش برای تعیین position جدید
    const lastSection = await db.section.findFirst({
      where: {
        chapterId: chapterId,
      },
      orderBy: {
        position: "desc",
      },
    });

    const newPosition = lastSection ? lastSection.position + 1 : 1;

    // ایجاد بخش جدید در دیتابیس
    const section = await db.section.create({
      data: {
        title,
        chapterId: chapterId,
        position: newPosition,
      },
    });

    return NextResponse.json(section);

  } catch (error) {
    console.error("[SECTIONS_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}