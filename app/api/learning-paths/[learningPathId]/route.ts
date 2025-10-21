// فایل: app/api/learning-paths/[learningPathId]/route.ts

import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth"; // <-- مطمئن شوید مسیر درست است
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";

// تابع DELETE (برای یکپارچگی، این را هم اصلاح می‌کنیم)
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

    const learningPath = await db.learningPath.findUnique({
      where: { id: learningPathId },
    });

    if (!learningPath) {
      return new NextResponse("Not found", { status: 404 });
    }

    // منطق دسترسی جدید: یا مالک باش یا ادمین
    const isOwner = learningPath.userId === session.user.id;
    const isAdmin = session.user.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const deletedLearningPath = await db.learningPath.delete({
      where: { id: learningPathId },
    });

    return NextResponse.json(deletedLearningPath);
  } catch (error) {
    console.log("[LEARNING_PATH_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


// تابع PATCH (این بخش اصلی مشکل است و اصلاح شده)
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

    const learningPath = await db.learningPath.findUnique({
      where: { id: learningPathId },
    });

    if (!learningPath) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // ===== شروع تغییرات کلیدی در منطق دسترسی =====
    const isOwner = learningPath.userId === session.user.id;
    const isAdmin = session.user.role === Role.ADMIN;

    // اگر کاربر نه مالک دوره بود و نه ادمین، دسترسی را رد کن
    if (!isOwner && !isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    // ===== پایان تغییرات کلیدی =====

    const updatedLearningPath = await db.learningPath.update({
      where: { id: learningPathId },
      data: { ...values },
    });

    return NextResponse.json(updatedLearningPath);
  } catch (error) {
    console.log("[LEARNING_PATH_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}