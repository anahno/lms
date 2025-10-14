"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client"; // این را وارد کنید

export async function POST(req: NextRequest) {
  try {
    // ...
    const { name, parentId } = await req.json();
    // ...
    const category = await db.category.create({
      data: {
        name,
        parentId: parentId ? parentId : null,
      },
    });

    return NextResponse.json(category);

  } catch (error) {
    // --- تغییر کلیدی: مدیریت خطای تکراری بودن ---
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return new NextResponse("A category with this name already exists", { status: 409 });
    }
    console.error("[CATEGORIES_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}