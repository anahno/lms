// فایل: app/api/learning-paths/[learningPathId]/chapters/[chapterId]/sections/[sectionId]/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client"; // ۱. Role را وارد کنید

// تابع برای ویرایش جزئیات بخش
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string; chapterId: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { learningPathId, chapterId, sectionId } = await context.params;
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
    const updatedSection = await db.section.update({
      where: {
        id: sectionId,
        chapterId: chapterId,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(updatedSection);

  } catch (error) {
    console.error("[SECTION_ID_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// تابع برای حذف بخش
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string; chapterId: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { learningPathId, chapterId, sectionId } = await context.params;
    
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
    const deletedSection = await db.section.delete({
      where: {
        id: sectionId,
        chapterId: chapterId,
      },
    });

    return NextResponse.json(deletedSection);

  } catch (error) {
    console.error("[SECTION_ID_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}