// فایل: app/api/learning-paths/[learningPathId]/chapters/reorder/route.ts
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

    const courseOwner = await db.learningPath.findUnique({
      where: { id: learningPathId, userId: session.user.id },
    });
    if (!courseOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // استفاده از تراکنش برای به‌روزرسانی همزمان همه position ها
    await db.$transaction(
      list.map((item: { id: string; position: number }) =>
        db.chapter.update({
          where: { id: item.id },
          data: { position: item.position },
        })
      )
    );

    return new NextResponse("Success", { status: 200 });

  } catch (error) {
    console.error("[CHAPTERS_REORDER_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}