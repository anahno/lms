// فایل نهایی و کامل: actions/mentorship-actions.ts
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Role, TimeSlot } from "@prisma/client";
import { createPaymentRequest, PaymentGateway } from "@/lib/payment/payment-service";

/**
 * تابع کمکی برای واکشی اسلات‌های به‌روز شده از دیتابیس.
 * این تابع پس از هر عملیات ایجاد یا حذف فراخوانی می‌شود.
 */
async function getUpdatedSlots(mentorId: string): Promise<TimeSlot[]> {
  return db.timeSlot.findMany({
    where: { 
      mentorId: mentorId, 
      status: { in: ["AVAILABLE", "BOOKED"] },
      startTime: { gte: new Date() } 
    },
    orderBy: { startTime: "asc" },
  });
}

/**
 * اطلاعات کامل منتورشیپ یک مدرس را واکشی می‌کند
 */
export const getMentorshipData = async (userId: string) => {
  try {
    const [mentorProfile, availableTimeSlots, confirmedBookings] = await Promise.all([
      db.mentorProfile.findUnique({ where: { userId } }),
      getUpdatedSlots(userId), // از تابع کمکی برای اطمینان از به‌روز بودن داده‌ها استفاده می‌کنیم
      db.booking.findMany({
        where: { mentorId: userId, status: "CONFIRMED", timeSlot: { startTime: { gte: new Date() } } },
        include: {
          student: { select: { name: true, email: true } },
          timeSlot: { select: { startTime: true, endTime: true } },
        },
        orderBy: { timeSlot: { startTime: "asc" } },
      }),
    ]);
    return { mentorProfile, availableTimeSlots, confirmedBookings };
  } catch (error) {
    console.error("[GET_MENTORSHIP_DATA_ERROR]", error);
    return { mentorProfile: null, availableTimeSlots: [], confirmedBookings: [] };
  }
};

/**
 * تنظیمات پروفایل منتورشیپ را به‌روزرسانی می‌کند
 */
export const updateMentorProfile = async (data: {
  isEnabled: boolean;
  hourlyRate?: number | null;
  mentorshipDescription?: string;
}) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user.role !== Role.INSTRUCTOR && session.user.role !== Role.ADMIN)) {
    return { error: "دسترسی غیرمجاز." };
  }
  const userId = session.user.id;
  try {
    await db.mentorProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
    revalidatePath("/dashboard/mentorship");
    return { success: "تنظیمات با موفقیت ذخیره شد." };
  } catch (error) {
    console.error("[UPDATE_MENTOR_PROFILE_ERROR]", error);
    return { error: "خطایی در ذخیره تنظیمات رخ داد." };
  }
};

/**
 * بازه‌های زمانی جدید ایجاد می‌کند و لیست کامل و به‌روز شده را برمی‌گرداند.
 */
export const createTimeSlots = async (formData: FormData): Promise<{ success?: string; error?: string; updatedSlots?: TimeSlot[] }> => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "دسترسی غیرمجاز." };
  }
  const userId = session.user.id;

  try {
    const date = formData.get("date") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const title = formData.get("title") as string | null;
    const color = (formData.get("color") as string) || "#10b981";

    if (!date || !startTime || !endTime) {
      return { error: "تاریخ و ساعات شروع و پایان الزامی است." };
    }

    const [year, month, day] = date.split('-').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startDateTime = new Date(year, month - 1, day, startHour, startMinute);
    const endDateTime = new Date(year, month - 1, day, endHour, endMinute);

    if (startDateTime >= endDateTime || startDateTime < new Date()) {
      return { error: "بازه زمانی نامعتبر است." };
    }

    const slotsToCreate = [];
    let currentSlotStart = startDateTime;
    while (currentSlotStart < endDateTime) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + 60 * 60 * 1000);
      if (currentSlotEnd > endDateTime) break;
      slotsToCreate.push({
        mentorId: userId,
        startTime: currentSlotStart,
        endTime: currentSlotEnd,
        title: title || null,
        color: color,
      });
      currentSlotStart = currentSlotEnd;
    }
    
    if (slotsToCreate.length === 0) {
      return { error: "هیچ بازه زمانی کاملی در این محدوده یافت نشد." };
    }

    await db.timeSlot.createMany({ data: slotsToCreate, skipDuplicates: true });
    
    revalidatePath("/dashboard/mentorship");
    
    const updatedSlots = await getUpdatedSlots(userId);
    
    return { success: `${slotsToCreate.length} بازه زمانی جدید ایجاد شد.`, updatedSlots };

  } catch (error) {
    console.error("[CREATE_TIME_SLOTS_ERROR]", error);
    return { error: "خطایی در ایجاد بازه‌های زمانی رخ داد." };
  }
};

/**
 * یک بازه زمانی را حذف می‌کند و لیست کامل و به‌روز شده را برمی‌گرداند.
 */
export const deleteTimeSlot = async (timeSlotId: string): Promise<{ success?: string; error?: string; updatedSlots?: TimeSlot[] }> => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "دسترسی غیرمجاز." };
    }
    const userId = session.user.id;
  
    try {
      const slotToDelete = await db.timeSlot.findUnique({ where: { id: timeSlotId } });
      if (!slotToDelete || slotToDelete.mentorId !== userId) {
        return { error: "بازه زمانی یافت نشد." };
      }
      if (slotToDelete.status !== 'AVAILABLE') {
        return { error: "فقط بازه‌های آزاد قابل حذف هستند." };
      }
  
      await db.timeSlot.delete({ where: { id: timeSlotId } });
  
      revalidatePath("/dashboard/mentorship");
      
      const updatedSlots = await getUpdatedSlots(userId);

      return { success: "بازه زمانی با موفقیت حذف شد.", updatedSlots };
    } catch (error) {
      console.error("[DELETE_TIME_SLOT_ERROR]", error);
      return { error: "خطایی در حذف بازه زمانی رخ داد." };
    }
};

/**
 * یک درخواست رزرو برای جلسه منتورشیپ ایجاد می‌کند
 */
export const createMentorshipBooking = async (timeSlotIds: string[], gateway: PaymentGateway) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "برای رزرو جلسه ابتدا باید وارد شوید." };
  }
  const studentId = session.user.id;
  const studentEmail = session.user.email;

  if (!timeSlotIds || timeSlotIds.length === 0) {
    return { error: "هیچ بازه زمانی انتخاب نشده است." };
  }

  let transactionResult; 

  try {
    transactionResult = await db.$transaction(async (prisma) => {
      const timeSlots = await prisma.timeSlot.findMany({
        where: { id: { in: timeSlotIds }, status: "AVAILABLE", startTime: { gte: new Date() } },
        include: { mentor: { select: { name: true, id: true } } },
      });

      if (timeSlots.length !== timeSlotIds.length) {
        throw new Error("یک یا چند بازه زمانی انتخاب شده دیگر در دسترس نیست.");
      }

      const mentorId = timeSlots[0].mentorId;
      const mentorName = timeSlots[0].mentor.name;
      
      const mentorProfile = await prisma.mentorProfile.findUnique({ where: { userId: mentorId } });

      if (!mentorProfile || !mentorProfile.isEnabled || mentorProfile.hourlyRate === null) {
        throw new Error("اطلاعات منتورشیپ برای این مدرس کامل نیست.");
      }

      const totalAmount = timeSlots.length * mentorProfile.hourlyRate;

      const purchase = await prisma.purchase.create({
        data: { userId: studentId, type: "MENTORSHIP", amount: totalAmount },
      });

      await prisma.booking.createMany({
        data: timeSlots.map(slot => ({
          studentId, mentorId, timeSlotId: slot.id, purchaseId: purchase.id, status: "PENDING_PAYMENT",
        })),
      });

      await prisma.timeSlot.updateMany({
        where: { id: { in: timeSlotIds } },
        data: { status: "BOOKED" },
      });

      return { purchase, amount: totalAmount, mentorName };
    });

    const paymentResponse = await createPaymentRequest(gateway, {
      userId: studentId,
      email: studentEmail,
      amount: transactionResult.amount,
      purchaseId: transactionResult.purchase.id,
      description: `رزرو ${timeSlotIds.length} جلسه مشاوره با ${transactionResult.mentorName}`,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/verify`,
    });
    
    if (!paymentResponse.success) {
        throw new Error(paymentResponse.error || "خطا در ایجاد درخواست پرداخت.");
    }
    
    return paymentResponse;

  } catch (error: any) {
    console.error("[CREATE_MENTORSHIP_BOOKING_ERROR]", error);
    
    return { error: error.message || "خطایی در فرآیند رزرو رخ داد." };
  }
};

/**
 * لینک جلسه آنلاین را به یک رزرو اضافه می‌کند
 */
export const addMeetingLinkToBooking = async (bookingId: string, meetingLink: string) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "دسترسی غیرمجاز." };
  }
  const userId = session.user.id;

  if (!meetingLink.trim() || !meetingLink.startsWith("http")) {
    return { error: "لینک جلسه نامعتبر است." };
  }

  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.mentorId !== userId) {
      return { error: "رزرو یافت نشد." };
    }

    await db.booking.update({
      where: { id: bookingId },
      data: { meetingLink },
    });

    revalidatePath("/dashboard/mentorship");
    return { success: "لینک جلسه با موفقیت ثبت شد." };
  } catch (error) {
    console.error("[ADD_MEETING_LINK_ERROR]", error);
    return { error: "خطایی در ثبت لینک رخ داد." };
  }
};