// فایل نهایی و قطعی: actions/mentorship-actions.ts
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { createPaymentRequest, PaymentGateway } from "@/lib/payment/payment-service";

// +++ افزودن لاگ‌های دقیق برای دیباگ در Vercel +++
const log = (message: string, data?: any) => {
  console.log(`[Mentorship Action] ${new Date().toISOString()} - ${message}`, data || '');
};

const logError = (message: string, error: any) => {
  console.error(`[Mentorship Action ERROR] ${new Date().toISOString()} - ${message}`, error);
};

export const createTimeSlots = async (previousState: any, formData: FormData) => {
  log("Attempting to create time slots...");
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    logError("Unauthorized access attempt.", null);
    return { error: "دسترسی غیرمجاز." };
  }
  const userId = session.user.id;
  
  try {
    const date = formData.get("date") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    
    log("Parsed form data:", { date, startTime, endTime });

    if (!date || !startTime || !endTime) {
      logError("Form data is incomplete.", { date, startTime, endTime });
      return { error: "اطلاعات ناقص است." };
    }

    const title = formData.get("title") as string | null;
    const color = (formData.get("color") as string) || "#10b981";

    const [year, month, day] = date.split('-').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startDateTime = new Date(year, month - 1, day, startHour, startMinute);
    const endDateTime = new Date(year, month - 1, day, endHour, endMinute);

    if (startDateTime >= endDateTime || startDateTime < new Date()) {
      logError("Invalid time range selected.", { startDateTime, endDateTime });
      return { error: "بازه زمانی نامعتبر است." };
    }

    const slotsToCreate = [];
    let currentSlotStart = startDateTime;
    while (currentSlotStart < endDateTime) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + 60 * 60 * 1000);
      if (currentSlotEnd > endDateTime) break;
      slotsToCreate.push({ mentorId: userId, startTime: currentSlotStart, endTime: currentSlotEnd, title: title || null, color: color });
      currentSlotStart = currentSlotEnd;
    }
    
    if (slotsToCreate.length === 0) {
      logError("No valid slots could be generated from the time range.", null);
      return { error: "هیچ بازه کاملی یافت نشد." };
    }

    log(`Preparing to create ${slotsToCreate.length} slots in DB.`);
    await db.timeSlot.createMany({ data: slotsToCreate, skipDuplicates: true });
    log("Successfully created slots in DB.");
    
    revalidatePath("/dashboard/mentorship");
    log("Path /dashboard/mentorship revalidated.");
    
    return { success: `${slotsToCreate.length} بازه زمانی ایجاد شد.` };

  } catch (error) {
    logError("Failed to create time slots due to a catch block error.", error);
    return { error: "خطای داخلی سرور در هنگام ایجاد بازه‌ها." };
  }
};


/**
 * یک بازه زمانی در دسترس را حذف می‌کند
 */
export const deleteTimeSlot = async (timeSlotId: string) => {
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
        return { error: "فقط بازه‌های زمانی آزاد قابل حذف هستند." };
      }
  
      await db.timeSlot.delete({ where: { id: timeSlotId } });
  
      revalidatePath("/dashboard/mentorship");
      
      return { success: "بازه زمانی با موفقیت حذف شد." };
    } catch (error) {
      console.error("[DELETE_TIME_SLOT_ERROR]", error);
      return { error: "خطای داخلی سرور در هنگام حذف بازه." };
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