// فایل: app/api/learning-paths/[learningPathId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // await کردن params
    const { learningPathId } = await context.params;
    const values = await req.json();

    const learningPathOwner = await db.learningPath.findUnique({
      where: {
        id: learningPathId,
        userId: session.user.id,
      },
    });

    if (!learningPathOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const updatedLearningPath = await db.learningPath.update({
      where: {
        id: learningPathId,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(updatedLearningPath);
  } catch (error) {
    console.log("[LEARNING_PATH_ID_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}