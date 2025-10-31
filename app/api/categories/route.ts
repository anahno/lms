// فایل کامل و اصلاح شده: app/api/categories/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache"; // <--- ۱. ایمپورت کردن revalidatePath

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden: Admins only", { status: 403 });
    }

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

    // ۲. به Next.js می‌گوییم که کش صفحه دسته‌بندی‌ها را باطل کند
    revalidatePath("/(dashboard)/categories");

    return NextResponse.json(category);

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return new NextResponse("A category with this name already exists", { status: 409 });
    }
    console.error("[CATEGORIES_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}