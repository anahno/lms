// فایل: app/api/learning-paths/[learningPathId]/route.ts

import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client"; // ۱. Role را ایمپورت کنید

// تابع DELETE (این تابع از قبل صحیح بود، اما برای کامل بودن اینجا آورده شده)
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { learningPathId } = await context.params;

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // بررسی مالکیت برای حذف
    const learningPath = await db.learningPath.findUnique({
      where: {
        id: learningPathId,
        userId: session.user.id,
      },
    });

    if (!learningPath) {
      return new NextResponse("Not found or Forbidden", { status: 404 });
    }

    const deletedLearningPath = await db.learningPath.delete({
      where: {
        id: learningPathId,
      },
    });

    return NextResponse.json(deletedLearningPath);
  } catch (error) {
    console.log("[LEARNING_PATH_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


// --- تابع PATCH (این بخش اصلی مشکل است و اصلاح شده) ---
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { learningPathId } = await context.params;
    const values = await req.json();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // ۲. ابتدا دوره مورد نظر را پیدا می‌کنیم
    const learningPath = await db.learningPath.findUnique({
      where: {
        id: learningPathId,
      },
    });

    if (!learningPath) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // ۳. منطق دسترسی جدید:
    // کاربر یا باید ادمین باشد، یا باید مالک (استاد) این دوره باشد.
    const userRole = (session.user as { role: Role }).role;
    const isOwner = learningPath.userId === session.user.id;
    const isAdmin = userRole === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // ۴. اگر دسترسی مجاز بود، دوره را به‌روزرسانی کن
    const updatedLearningPath = await db.learningPath.update({
      where: {
        id: learningPathId,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(updatedLearningPath);
  } catch (error) {
    console.log("[LEARNING_PATH_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}