// فایل: app/api/categories/[categoryId]/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    // --- شرط جدید: اگر کاربر لاگین نکرده یا ادمین نیست، دسترسی را رد کن ---
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden: Admins only", { status: 403 });
    }
    
    const { categoryId } = await context.params;
    const values = await req.json();

    // جلوگیری از تبدیل یک دسته‌بندی به زیرمجموعه خودش
    if (values.parentId === categoryId) {
      return new NextResponse("یک دسته‌بندی نمی‌تواند والد خودش باشد", { status: 400 });
    }

    // جلوگیری از ایجاد حلقه در درخت دسته‌بندی‌ها
    // (اگر A والد B است، B نمی‌تواند والد A شود)
    if (values.parentId) {
      const parentCategory = await db.category.findUnique({
        where: { id: values.parentId },
        select: { parentId: true }
      });

      if (parentCategory?.parentId === categoryId) {
        return new NextResponse("این عملیات باعث ایجاد حلقه در ساختار دسته‌بندی می‌شود", { status: 400 });
      }
    }

    const category = await db.category.update({
      where: { id: categoryId },
      data: { ...values },
    });

    return NextResponse.json(category);

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new NextResponse("دسته‌بندی با این نام قبلاً وجود دارد", { status: 409 });
    }
    console.error("[CATEGORY_ID_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden: Admins only", { status: 403 });
    }
    
    const { categoryId } = await context.params;

    // بررسی وجود زیرمجموعه
    const subcategories = await db.category.findMany({
      where: { parentId: categoryId }
    });

    if (subcategories.length > 0) {
      return new NextResponse(
        "این دسته‌بندی دارای زیرمجموعه است. ابتدا زیرمجموعه‌ها را حذف کنید.",
        { status: 400 }
      );
    }

    // بررسی وجود دوره (LearningPath) متصل به این دسته‌بندی
    const connectedPaths = await db.learningPath.findMany({
      where: { categoryId: categoryId },
      select: { id: true, title: true }
    });

    if (connectedPaths.length > 0) {
      const pathTitles = connectedPaths.map(p => p.title).join("، ");
      return new NextResponse(
        `این دسته‌بندی به ${connectedPaths.length} دوره متصل است (${pathTitles}). ابتدا دوره‌ها را به دسته‌بندی دیگری منتقل کنید.`,
        { status: 400 }
      );
    }

    const deletedCategory = await db.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json(deletedCategory);

  } catch (error) {
    console.error("[CATEGORY_ID_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}