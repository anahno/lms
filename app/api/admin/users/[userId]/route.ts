// فایل: app/api/admin/users/[userId]/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

// تابع برای تغییر نقش کاربر
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    const { userId } = await context.params;
    const { role } = await req.json();

    if (!role || !Object.values(Role).includes(role)) {
        return new NextResponse("نقش نامعتبر است", { status: 400 });
    }

    // ادمین نمی‌تواند نقش خودش را تغییر دهد
    if (userId === session.user.id) {
        return new NextResponse("شما نمی‌توانید نقش خودتان را تغییر دهید", { status: 403 });
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { role },
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error("[USER_ID_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// تابع برای حذف کاربر
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    const { userId } = await context.params;

    // ادمین نمی‌تواند خودش را حذف کند
    if (userId === session.user.id) {
        return new NextResponse("شما نمی‌توانید حساب کاربری خودتان را حذف کنید", { status: 403 });
    }

    const deletedUser = await db.user.delete({
      where: { id: userId },
    });

    return NextResponse.json(deletedUser);

  } catch (error) {
    console.error("[USER_ID_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}