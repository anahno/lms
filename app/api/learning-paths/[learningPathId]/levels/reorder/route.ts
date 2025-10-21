// فایل: app/api/learning-paths/[learningPathId]/levels/reorder/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
// ===== شروع تغییر =====
import { getServerSession } from "next-auth/next"; // از 'next-auth/next' استفاده کنید
// ===== پایان تغییر =====
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

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

    const learningPath = await db.learningPath.findUnique({
      where: { id: learningPathId },
    });
    if (!learningPath) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const isOwner = learningPath.userId === session.user.id;
    const isAdmin = session.user.role === Role.ADMIN;
    if (!isOwner && !isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

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