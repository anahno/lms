// فایل: app/api/learning-paths/[learningPathId]/route.ts

import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";

// این تابع بدون تغییر باقی می‌ماند
function generateSlug(title: string): string {
  const allowedChars = "a-zA-Z0-9\u0600-\u06FF\\+";
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(new RegExp(`[^${allowedChars}\\-]+`, 'g'), '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}


// تابع DELETE با پارامترهای اصلاح شده
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string }> } // <--- اصلاح ۱
) {
    try {
        const session = await getServerSession(authOptions);
        const { learningPathId } = await context.params; // <--- اصلاح ۲

        if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
        }

        const learningPath = await db.learningPath.findUnique({
        where: { id: learningPathId },
        });

        if (!learningPath) {
        return new NextResponse("Not found", { status: 404 });
        }

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


// تابع PATCH با پارامترهای اصلاح شده
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string }> } // <--- اصلاح ۱
) {
  try {
    const session = await getServerSession(authOptions);
    const { learningPathId } = await context.params; // <--- اصلاح ۲
    const values = await req.json();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // --- منطق اعتبارسنجی اسلاگ (بدون تغییر) ---
    if (values.slug) {
      const cleanSlug = generateSlug(values.slug);

      const existingPath = await db.learningPath.findFirst({
        where: {
          slug: cleanSlug,
          id: { not: learningPathId },
        },
      });

      if (existingPath) {
        return new NextResponse("این پیوند یکتا قبلاً توسط دوره دیگری استفاده شده است.", { status: 409 });
      }
      
      values.slug = cleanSlug;
    }

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