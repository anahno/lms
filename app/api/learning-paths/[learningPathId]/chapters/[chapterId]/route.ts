// فایل: app/api/learning-paths/[learningPathId]/chapters/[chapterId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string; chapterId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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

    // به‌روزرسانی فصل در پایگاه داده
    const chapter = await db.chapter.update({
      where: {
        id: chapterId,
        learningPathId: learningPathId,
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
  context: { params: Promise<{ learningPathId: string; chapterId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { learningPathId, chapterId } = await context.params;
    
    // بررسی مالکیت
    const courseOwner = await db.learningPath.findUnique({
      where: { id: learningPathId, userId: session.user.id },
    });
    if (!courseOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // حذف فصل
    const deletedChapter = await db.chapter.delete({
      where: { id: chapterId, learningPathId: learningPathId },
    });

    return NextResponse.json(deletedChapter);

  } catch (error) {
    console.error("[CHAPTER_ID_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}