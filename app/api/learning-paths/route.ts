// فایل: app/api/learning-paths/route.ts

import {  NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // <-- از مسیر جدید import می‌کنیم
import { db } from "@/lib/db";

// تابع POST برای ایجاد یک مسیر یادگیری جدید
export async function POST(_req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await _req.json();
    const { title } = body;

    if (!title) {
      return new NextResponse("Title is required", { status: 400 });
    }

    const learningPath = await db.learningPath.create({
      data: {
        title: title,
        userId: session.user.id,
      },
    });

    return NextResponse.json(learningPath);

  } catch (error) {
    console.log("[LEARNING_PATHS_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// تابع GET برای دریافت لیست تمام مسیرهای یادگیری کاربر
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const learningPaths = await db.learningPath.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(learningPaths);

  } catch (error) {
    console.error("[LEARNING_PATHS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}