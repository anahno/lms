// فایل: app/api/learning-paths/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route"; // تنظیمات NextAuth که export کردیم
import { db } from "@/lib/db"; // نمونه Prisma Client

export async function POST(req: Request) {
  try {
    // ۱. دریافت اطلاعات کاربر وارد شده به صورت امن در سمت سرور
    const session = await getServerSession(authOptions);

    // ۲. اگر کاربر وارد نشده بود، دسترسی را مسدود کن
    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // ۳. اطلاعات ارسال شده از فرم را بخوان
    const body = await req.json();
    const { title } = body;

    // ۴. اعتبارسنجی: عنوان الزامی است
    if (!title) {
      return new NextResponse("Title is required", { status: 400 });
    }

    // ۵. ایجاد مسیر یادگیری جدید در پایگاه داده
    const learningPath = await db.learningPath.create({
      data: {
        title: title,
        // مسیر یادگیری را به کاربری که وارد شده است متصل کن
        userId: session.user.id, 
      },
    });

    // ۶. پاسخ موفقیت‌آمیز را همراه با اطلاعات مسیر جدید برگردان
    return NextResponse.json(learningPath);

  } catch (error) {
    console.log("[LEARNING_PATHS_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}