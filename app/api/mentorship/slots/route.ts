// فایل: app/api/mentorship/slots/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const slots = await db.timeSlot.findMany({
      where: { 
        mentorId: session.user.id,
        status: { in: ["AVAILABLE", "BOOKED"] },
        startTime: { gte: new Date() }
      },
      orderBy: { startTime: "asc" },
      // ✅ مطمئن شوید که تمام فیلدها از جمله color و title برگردانده می‌شوند
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        title: true,
        color: true, // ✅ این خط مهم است
        mentorId: true,
      }
    });

    return NextResponse.json(slots);
  } catch (error) {
    console.error("[GET_SLOTS_ERROR]", error);
    return NextResponse.json({ error: "خطا در دریافت بازه‌ها" }, { status: 500 });
  }
}