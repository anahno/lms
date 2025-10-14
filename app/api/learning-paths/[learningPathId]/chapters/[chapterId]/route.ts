// فایل: app/api/learning-paths/[learningPathId]/chapters/[chapterId]/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  // --- ۱. اصلاح تایپ context ---
  context: { params: Promise<{ learningPathId: string; chapterId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // --- ۲. اضافه کردن await ---
    const { learningPathId, chapterId } = await context.params;
    const values = await req.json();

    // بررسی مالکیت مسیر یادگیری والد
    const courseOwner = await db.learningPath.findUnique({
      where: {
        id: learningPathId,
        userId: session.user.id,
      },
    });
    if (!courseOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // --- ۳. اصلاح query برای به‌روزرسانی فصل ---
    // ما فقط به chapterId برای پیدا کردن رکورد نیاز داریم.
    // شرط تعلق به learningPath به صورت ضمنی در بررسی مالکیت بالا انجام شده.
    const chapter = await db.chapter.update({
      where: {
        id: chapterId,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(chapter);

  } catch (error) {
    console.error("[CHAPTER_ID_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  // --- ۴. اصلاح تایپ context ---
  context: { params: Promise<{ learningPathId: string; chapterId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // --- ۵. اضافه کردن await ---
    const { learningPathId, chapterId } = await context.params;
    
    // بررسی مالکیت
    const courseOwner = await db.learningPath.findUnique({
      where: { id: learningPathId, userId: session.user.id },
    });
    if (!courseOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // --- ۶. اصلاح query برای حذف فصل ---
    // فقط به chapterId برای حذف نیاز داریم.
    const deletedChapter = await db.chapter.delete({
      where: { id: chapterId },
    });

    return NextResponse.json(deletedChapter);

  } catch (error) {
    console.error("[CHAPTER_ID_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}