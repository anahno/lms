// فایل جدید: app/api/mentorship/slots/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// این تابع همیشه داده‌های تازه را از دیتابیس می‌خواند
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    const timeSlots = await db.timeSlot.findMany({
      where: {
        mentorId: userId,
        status: { in: ["AVAILABLE", "BOOKED"] },
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(timeSlots);
  } catch (error) {
    console.error("[GET_SLOTS_API_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
