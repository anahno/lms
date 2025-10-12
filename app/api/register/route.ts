// فایل: app/api/register/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db"; // نمونه Prisma Client که ساختیم

export async function POST(req: Request) {
  try {
    // ۱. دریافت اطلاعات از بدنه درخواست
    const body = await req.json();
    const { name, email, password } = body;

    // ۲. اعتبارسنجی اولیه
    if (!email || !password) {
      return new NextResponse("ایمیل و رمز عبور الزامی است", { status: 400 });
    }

    // ۳. بررسی اینکه آیا کاربر با این ایمیل قبلاً ثبت‌نام کرده است یا نه
    const existingUser = await db.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return new NextResponse("کاربری با این ایمیل قبلاً ثبت‌نام کرده است", { status: 409 }); // 409 Conflict
    }

    // ۴. هش کردن رمز عبور
    // هرگز رمز عبور را به صورت متن ساده ذخیره نکنید!
    const hashedPassword = await bcrypt.hash(password, 12);

    // ۵. ایجاد کاربر جدید در پایگاه داده
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // ۶. ارسال پاسخ موفقیت‌آمیز
    return NextResponse.json(user);

  } catch (error) {
    console.log("[REGISTER_ERROR]", error);
    return new NextResponse("خطای داخلی سرور", { status: 500 });
  }
}