// فایل: app/api/learning-paths/route.ts
import { NextRequest, NextResponse } from "next/server"; // ۱. NextRequest را اینجا وارد می‌کنیم
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
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

// --- تابع GET اصلاح شده ---
export async function GET(_req: NextRequest) { // ۲. نام req به _req تغییر کرد
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