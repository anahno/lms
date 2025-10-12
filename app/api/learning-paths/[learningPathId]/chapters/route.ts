// فایل: app/api/learning-paths/[learningPathId]/chapters/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  // ۱. تایپ params را به Promise تغییر می‌دهیم
  context: { params: Promise<{ learningPathId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    // ۲. قبل از دسترسی به learningPathId، آن را await می‌کنیم
    const { learningPathId } = await context.params;
    const { title } = await req.json();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const courseOwner = await db.learningPath.findUnique({
      where: { id: learningPathId, userId: session.user.id },
    });
    if (!courseOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const lastChapter = await db.chapter.findFirst({
      where: { learningPathId: learningPathId },
      orderBy: { position: "desc" },
    });
    const newPosition = lastChapter ? lastChapter.position + 1 : 1;

    const chapter = await db.chapter.create({
      data: {
        title,
        position: newPosition,
        learningPathId: learningPathId,
      },
    });

    return NextResponse.json(chapter);

  } catch (error) {
    console.error("[CHAPTERS_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}