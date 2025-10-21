// فایل: app/api/learning-paths/[learningPathId]/chapters/[chapterId]/sections/reorder/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client"; // ۱. Role را وارد کنید

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string; chapterId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { learningPathId } = await context.params; 
    const { list } = await req.json();

    // ===== شروع الگوی جدید بررسی دسترسی =====
    const learningPath = await db.learningPath.findUnique({
      where: { id: learningPathId },
    });
    if (!learningPath) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const isOwner = learningPath.userId === session.user.id;
    const isAdmin = session.user.role === Role.ADMIN;
    if (!isOwner && !isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    // ===== پایان الگوی جدید بررسی دسترسی =====
    
    // به‌روزرسانی همزمان همه position ها در یک تراکنش
    const transaction = list.map((item: { id: string; position: number }) =>
      db.section.update({
        where: { id: item.id },
        data: { position: item.position },
      })
    );

    await db.$transaction(transaction);

    return new NextResponse("Success", { status: 200 });

  } catch (error) {
    console.error("[SECTIONS_REORDER_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}