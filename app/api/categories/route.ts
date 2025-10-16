// فایل: app/api/categories/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // ۱. دریافت اطلاعات نشست (session) کاربر
    const session = await getServerSession(authOptions);

    // ۲. بررسی دسترسی: اگر کاربر لاگین نکرده یا نقش او ادمین نیست، خطا برگردان
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden: Admins only", { status: 403 });
    }

    // ۳. اگر دسترسی مجاز بود، بقیه منطق اجرا می‌شود
    const { name, parentId } = await req.json();

    if (!name) {
        return new NextResponse("Name is required", { status: 400 });
    }

    const category = await db.category.create({
      data: {
        name,
        parentId: parentId ? parentId : null,
      },
    });

    return NextResponse.json(category);

  } catch (error) {
    // مدیریت خطای تکراری بودن نام دسته‌بندی
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return new NextResponse("A category with this name already exists", { status: 409 });
    }
    console.error("[CATEGORIES_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}