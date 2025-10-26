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


export const cleanupExpiredMentorshipBookings = async (mentorId: string) => {
  console.log(`[Cleanup] Running cleanup job for mentor: ${mentorId}`);
  
  // تعریف زمان انقضا (مثلاً ۲۰ دقیقه قبل)
  const expiryTime = new Date(Date.now() - 5 * 60 * 1000);

  try {
    // ۱. تمام رزروهای در انتظار پرداخت و منقضی شده برای این منتور را پیدا کن
    const expiredBookings = await db.booking.findMany({
      where: {
        mentorId: mentorId,
        status: "PENDING_PAYMENT",
        createdAt: {
          lt: expiryTime, // تاریخ ایجادشان قبل از زمان انقضا باشد
        },
      },
      select: {
        timeSlotId: true,
        purchaseId: true,
      },
    });

    if (expiredBookings.length === 0) {
      console.log("[Cleanup] No expired bookings found.");
      return { success: "هیچ رزرو منقضی شده‌ای یافت نشد." };
    }

    const timeSlotIdsToRelease = expiredBookings.map(b => b.timeSlotId);
    const purchaseIdsToDelete = expiredBookings.map(b => b.purchaseId).filter((id): id is string => id !== null);

    // ۲. در یک تراکنش، تمام اطلاعات مرتبط را پاک‌سازی/آپدیت کن
    await db.$transaction([
      // الف) بازه‌های زمانی را به حالت AVAILABLE برگردان
      db.timeSlot.updateMany({
        where: { id: { in: timeSlotIdsToRelease } },
        data: { status: "AVAILABLE" },
      }),
      // ب) وضعیت رزروها را به CANCELLED تغییر بده (برای سابقه)
      db.booking.updateMany({
        where: { timeSlotId: { in: timeSlotIdsToRelease } },
        data: { status: "CANCELLED" },
      }),
      // ج) وضعیت خریدهای مرتبط را به FAILED تغییر بده
      db.purchase.updateMany({
        where: { id: { in: purchaseIdsToDelete } },
        data: { status: "FAILED" },
      }),
    ]);
    
    console.log(`[Cleanup] Successfully cleaned up ${expiredBookings.length} expired bookings.`);
    return { success: `${expiredBookings.length} رزرو منقضی شده پاک‌سازی شد.` };

  } catch (error) {
    console.error("[CLEANUP_EXPIRED_BOOKINGS_ERROR]", error);
    return { error: "خطا در پاک‌سازی رزروهای منقضی شده." };
  }
};