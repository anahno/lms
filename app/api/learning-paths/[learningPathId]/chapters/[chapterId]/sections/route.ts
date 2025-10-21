// فایل: app/api/learning-paths/[learningPathId]/chapters/[chapterId]/sections/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client"; // ۱. Role را وارد کنید

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string; chapterId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { learningPathId, chapterId } = await context.params;
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

    
    // اطمینان از اینکه فصل مورد نظر وجود دارد و متعلق به همین دوره است
    const chapter = await db.chapter.findUnique({
        where: {
            id: chapterId,
            level: {
                learningPathId: learningPathId,
            }
        }
    });
    if (!chapter) {
        return new NextResponse("Chapter not found in this course", { status: 404 });
    }

    // پیدا کردن آخرین بخش برای تعیین position جدید
    const lastSection = await db.section.findFirst({
      where: { chapterId: chapterId },
      orderBy: { position: "desc" },
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