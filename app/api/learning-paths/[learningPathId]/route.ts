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


// تابع DELETE بدون تغییر باقی می‌ماند
export async function DELETE(
  req: NextRequest,
  context: { params: { learningPathId: string } }
) {
    /* ... محتوای این تابع بدون تغییر است ... */
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


// تابع PATCH برای پذیرش و اعتبارسنجی اسلاگ دستی بازنویسی می‌شود
export async function PATCH(
  req: NextRequest,
  context: { params: { learningPathId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { learningPathId } = await context.params;
    const values = await req.json();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // --- شروع منطق جدید و نهایی برای اعتبارسنجی اسلاگ ---

    // اگر کاربر یک اسلاگ جدید ارسال کرده بود
    if (values.slug) {
      // ابتدا آن را برای اطمینان از فرمت صحیح، پاکسازی می‌کنیم
      const cleanSlug = generateSlug(values.slug);

      // سپس بررسی می‌کنیم که آیا دوره دیگری از این اسلاگ استفاده می‌کند یا خیر
      const existingPath = await db.learningPath.findFirst({
        where: {
          slug: cleanSlug,
          id: { not: learningPathId }, // مهم: این دوره را از بررسی مستثنی کن
        },
      });

      // اگر اسلاگ تکراری بود، خطا برگردان
      if (existingPath) {
        return new NextResponse("این پیوند یکتا قبلاً توسط دوره دیگری استفاده شده است.", { status: 409 }); // 409 Conflict
      }
      
      // اگر تکراری نبود، اسلاگ پاکسازی شده را برای ذخیره در دیتابیس قرار بده
      values.slug = cleanSlug;
    }
    // --- پایان منطق جدید ---

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