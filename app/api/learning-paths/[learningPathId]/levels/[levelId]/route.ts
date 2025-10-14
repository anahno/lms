// فایل: app/api/learning-paths/[learningPathId]/levels/[levelId]/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

// تابع برای ویرایش (مثلا تغییر عنوان)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string; levelId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { learningPathId, levelId } = await context.params;
    const values = await req.json();

    // بررسی مالکیت
    const learningPathOwner = await db.learningPath.findUnique({
      where: {
        id: learningPathId,
        userId: session.user.id,
      },
    });
    if (!learningPathOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const updatedLevel = await db.level.update({
      where: {
        id: levelId,
        learningPathId: learningPathId,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(updatedLevel);

  } catch (error) {
    console.error("[LEVEL_ID_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// تابع برای حذف
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string; levelId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { learningPathId, levelId } = await context.params;
    
    // بررسی مالکیت
    const learningPathOwner = await db.learningPath.findUnique({
      where: {
        id: learningPathId,
        userId: session.user.id
      },
    });
    if (!learningPathOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // حذف سطح
    const deletedLevel = await db.level.delete({
      where: {
        id: levelId,
        learningPathId: learningPathId,
      },
    });

    return NextResponse.json(deletedLevel);

  } catch (error) {
    console.error("[LEVEL_ID_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
