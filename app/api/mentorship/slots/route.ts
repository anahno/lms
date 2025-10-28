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
}```

#### مرحله ۲: ساده‌سازی فایل `actions/mentorship-actions.ts`

حالا توابع `create` و `delete` را به ساده‌ترین حالت خود برمی‌گردانیم. آنها دیگر نیازی به برگرداندن داده ندارند.

**فایل اصلاح شده:** `actions/mentorship-actions.ts`

```typescript
// فایل نهایی و کامل: actions/mentorship-actions.ts
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { createPaymentRequest, PaymentGateway } from "@/lib/payment/payment-service";

// ... توابع getMentorshipData, updateMentorProfile و ... بدون تغییر باقی می‌مانند ...
export const getMentorshipData = async (userId: string) => { /* ... */ };
export const updateMentorProfile = async (data: any) => { /* ... */ };


/**
 * بازه‌های زمانی جدید ایجاد می‌کند
 */
export const createTimeSlots = async (formData: FormData) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user.role !== Role.INSTRUCTOR && session.user.role !== Role.ADMIN)) {
    return { error: "دسترسی غیرمجاز." };
  }
  const userId = session.user.id;

  try {
    // ... منطق ایجاد اسلات‌ها بدون تغییر ...
    const date = formData.get("date") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const title = formData.get("title") as string | null;
    const color = (formData.get("color") as string) || "#10b981";
    if (!date || !startTime || !endTime) { return { error: "اطلاعات ناقص است." }; }
    const [year, month, day] = date.split('-').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startDateTime = new Date(year, month - 1, day, startHour, startMinute);
    const endDateTime = new Date(year, month - 1, day, endHour, endMinute);
    if (startDateTime >= endDateTime || startDateTime < new Date()) { return { error: "بازه زمانی نامعتبر." }; }
    const slotsToCreate = [];
    let currentSlotStart = startDateTime;
    while (currentSlotStart < endDateTime) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + 60 * 60 * 1000);
      if (currentSlotEnd > endDateTime) break;
      slotsToCreate.push({ mentorId: userId, startTime: currentSlotStart, endTime: currentSlotEnd, title: title || null, color: color });
      currentSlotStart = currentSlotEnd;
    }
    if (slotsToCreate.length === 0) { return { error: "هیچ بازه کاملی یافت نشد." }; }

    await db.timeSlot.createMany({ data: slotsToCreate, skipDuplicates: true });
    
    // فقط کش را باطل می‌کنیم
    revalidatePath("/dashboard/mentorship");
    
    return { success: `${slotsToCreate.length} بازه زمانی ایجاد شد.` };

  } catch (error) {
    console.error("[CREATE_TIME_SLOTS_ERROR]", error);
    return { error: "خطا در ایجاد بازه‌های زمانی." };
  }
};

/**
 * یک بازه زمانی در دسترس را حذف می‌کند
 */
export const deleteTimeSlot = async (timeSlotId: string) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) { return { error: "دسترسی غیرمجاز." }; }
    const userId = session.user.id;
  
    try {
      const slotToDelete = await db.timeSlot.findUnique({ where: { id: timeSlotId } });
      if (!slotToDelete || slotToDelete.mentorId !== userId) { return { error: "بازه زمانی یافت نشد." }; }
      if (slotToDelete.status !== 'AVAILABLE') { return { error: "فقط بازه‌های آزاد قابل حذف هستند." }; }
  
      await db.timeSlot.delete({ where: { id: timeSlotId } });
  
      // فقط کش را باطل می‌کنیم
      revalidatePath("/dashboard/mentorship");
      
      return { success: "بازه زمانی با موفقیت حذف شد." };
    } catch (error) {
      console.error("[DELETE_TIME_SLOT_ERROR]", error);
      return { error: "خطا در حذف بازه زمانی." };
    }
};

// ... بقیه توابع فایل (createMentorshipBooking, etc.) را در اینجا نگه دارید ...