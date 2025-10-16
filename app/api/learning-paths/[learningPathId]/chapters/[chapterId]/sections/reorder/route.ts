// فایل: app/api/learning-paths/[learningPathId]/chapters/[chapterId]/sections/reorder/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  // --- تغییر در اینجا ---
  context: { params: Promise<{ learningPathId: string; chapterId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // --- و تغییر در اینجا (اضافه شدن await) ---
    // chapterId برای احراز هویت لازم نیست، فقط learningPathId کافی است
    const { learningPathId } = await context.params; 
    const { list } = await req.json();

    // بررسی مالکیت
    const learningPathOwner = await db.learningPath.findUnique({
      where: {
        id: learningPathId,
        userId: session.user.id,
      },
    });
    if (!learningPathOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // به‌روزرسانی همزمان همه position ها در یک تراکنش
    const transaction = list.map((item: { id: string; position: number }) =>
      db.section.update({
        where: { id: item.id },
        data: { position: item.position },
      })
    );

    await db.$transaction(transaction);

    return new NextResponse("Success", { status: 200 });

  } catch (error) {
    console.error("[SECTIONS_REORDER_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}