// فایل: app/api/learning-paths/[learningPathId]/chapters/[chapterId]/sections/[sectionId]/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

// تابع برای ویرایش جزئیات بخش
export async function PATCH(
  req: NextRequest,
  // --- تغییر در اینجا ---
  context: { params: Promise<{ learningPathId: string; chapterId: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // --- و تغییر در اینجا (اضافه شدن await) ---
    const { learningPathId, chapterId, sectionId } = await context.params;
    const values = await req.json();

    // بقیه کد بدون تغییر
    const learningPathOwner = await db.learningPath.findUnique({
      where: {
        id: learningPathId,
        userId: session.user.id,
      },
    });
    if (!learningPathOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const updatedSection = await db.section.update({
      where: {
        id: sectionId,
        chapterId: chapterId,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(updatedSection);

  } catch (error) {
    console.error("[SECTION_ID_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// تابع برای حذف بخش
export async function DELETE(
  req: NextRequest,
  // --- تغییر در اینجا ---
  context: { params: Promise<{ learningPathId: string; chapterId: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // --- و تغییر در اینجا (اضافه شدن await) ---
    const { learningPathId, chapterId, sectionId } = await context.params;
    
    // بقیه کد بدون تغییر
    const learningPathOwner = await db.learningPath.findUnique({
      where: {
        id: learningPathId,
        userId: session.user.id
      },
    });
    if (!learningPathOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    const deletedSection = await db.section.delete({
      where: {
        id: sectionId,
        chapterId: chapterId,
      },
    });

    return NextResponse.json(deletedSection);

  } catch (error) {
    console.error("[SECTION_ID_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}