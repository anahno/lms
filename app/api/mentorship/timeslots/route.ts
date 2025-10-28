import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const timeSlots = await db.timeSlot.findMany({
      where: { 
        mentorId: session.user.id,
        status: { in: ["AVAILABLE", "BOOKED"] },
        startTime: { gte: new Date() }
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(timeSlots);
  } catch (error) {
    console.error("[API_GET_TIMESLOTS_ERROR]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}