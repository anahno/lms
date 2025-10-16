// فایل: app/api/learning-paths/[learningPathId]/levels/reorder/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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
    
    // استفاده از تراکنش برای به‌روزرسانی همزمان همه position ها
    const transaction = list.map((item: { id: string; position: number }) =>
      db.level.update({
        where: { id: item.id },
        data: { position: item.position },
      })
    );

    await db.$transaction(transaction);

    return new NextResponse("Success", { status: 200 });

  } catch (error) {
    console.error("[LEVELS_REORDER_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}