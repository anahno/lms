// فایل: app/api/learning-paths/[learningPathId]/route.ts

import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
// --- ۱. ایمپورت NextRequest و NextResponse ---
import { NextRequest, NextResponse } from "next/server";

// ... (تابع DELETE شما اگر وجود دارد، می‌تواند به همین شکل اصلاح شود) ...

export async function PATCH(
  // --- ۲. استفاده از NextRequest و context ---
  req: NextRequest,
  context: { params: Promise<{ learningPathId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    // --- ۳. Await کردن params برای استخراج مقادیر ---
    const { learningPathId } = await context.params;
    const values = await req.json();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const learningPath = await db.learningPath.update({
      where: {
        id: learningPathId,
        //userId: session.user.id, // می‌توانید این شرط را برای امنیت بیشتر فعال نگه دارید
      },
      data: {
        ...values,
      },
      // این include برای اطمینان از صحت ساختار است
      include: {
        levels: true,
      }
    });

    return NextResponse.json(learningPath);
  } catch (error) {
    console.log("[LEARNING_PATH_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest, // برای هماهنگی، این را هم اصلاح کنید
  context: { params: Promise<{ learningPathId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { learningPathId } = await context.params;

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const learningPath = await db.learningPath.findUnique({
      where: {
        id: learningPathId,
        userId: session.user.id,
      },
    });

    if (!learningPath) {
      return new NextResponse("Not found", { status: 404 });
    }

    // اینجا می‌توانید منطق مربوط به حذف فایل‌ها از S3 یا فضاهای دیگر را اضافه کنید

    const deletedLearningPath = await db.learningPath.delete({
      where: {
        id: learningPathId,
      },
    });

    return NextResponse.json(deletedLearningPath);
  } catch (error) {
    console.log("[LEARNING_PATH_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}