// فایل: app/api/account/password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    const user = await db.user.findUnique({ where: { id: session.user.id } });

    if (!user || !user.password) {
      return new NextResponse("کاربر یافت نشد یا با روش دیگری ثبت‌نام کرده است.", { status: 403 });
    }

    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordCorrect) {
      return new NextResponse("رمز عبور فعلی اشتباه است.", { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return new NextResponse("رمز عبور با موفقیت تغییر یافت.", { status: 200 });

  } catch (error) {
    console.error("[PASSWORD_UPDATE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}