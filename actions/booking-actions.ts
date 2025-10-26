// فایل: actions/booking-actions.ts
"use server";

import { db } from "@/lib/db";

/**
 * تمام جلسات مشاوره رزرو شده توسط یک دانشجوی خاص را واکشی می‌کند
 */
export const getStudentBookings = async (studentId: string) => {
  try {
    const bookings = await db.booking.findMany({
      where: {
        studentId: studentId,
        // فقط جلساتی که پرداختشان موفق بوده را نمایش می‌دهیم
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      include: {
        mentor: {
          select: {
            name: true,
            image: true,
          },
        },
        timeSlot: {
          select: {
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        timeSlot: {
          startTime: "desc", // جدیدترین‌ها در بالا
        },
      },
    });
    return bookings;
  } catch (error) {
    console.error("[GET_STUDENT_BOOKINGS_ERROR]", error);
    return [];
  }
};