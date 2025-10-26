// فایل: actions/mentorship-actions.ts
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

/**
 * اطلاعات کامل منتورشیپ یک مدرس را واکشی می‌کند
 * (پروفایل، بازه‌های زمانی آزاد، و جلسات رزرو شده)
 */
export const getMentorshipData = async (userId: string) => {
  try {
    const [mentorProfile, availableTimeSlots, confirmedBookings] = await Promise.all([
      db.mentorProfile.findUnique({
        where: { userId },
      }),
      db.timeSlot.findMany({
        where: {
          mentorId: userId,
          status: "AVAILABLE",
          startTime: { gte: new Date() } // فقط بازه‌های زمانی آینده
        },
        orderBy: { startTime: "asc" },
      }),
      db.booking.findMany({
        where: {
          mentorId: userId,
          status: "CONFIRMED",
          timeSlot: {
            startTime: { gte: new Date() } // فقط جلسات آینده
          }
        },
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
 * تنظیمات پروفایل منتورشیپ یک مدرس را ایجاد یا به‌روزرسانی می‌کند
 */
// +++ فقط این تابع را آپدیت کنید +++
export const updateMentorProfile = async (data: {
  isEnabled: boolean;
  hourlyRate?: number | null; // <-- نوع را برای پذیرش null آپدیت کنید
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
      update: {
        isEnabled: data.isEnabled,
        // اینجا چون ورودی می‌تواند null باشد، منطق ساده‌تر می‌شود
        hourlyRate: data.hourlyRate,
        mentorshipDescription: data.mentorshipDescription,
      },
      create: {
        userId,
        isEnabled: data.isEnabled,
        hourlyRate: data.hourlyRate,
        mentorshipDescription: data.mentorshipDescription,
      },
    });

    revalidatePath("/dashboard/mentorship");
    return { success: "تنظیمات با موفقیت ذخیره شد." };
  } catch (error) {
    console.error("[UPDATE_MENTOR_PROFILE_ERROR]", error);
    return { error: "خطایی در ذخیره تنظیمات رخ داد." };
  }
};


/**
 * بازه‌های زمانی جدید برای یک مدرس ایجاد می‌کند
 */
export const createTimeSlots = async (formData: FormData) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user.role !== Role.INSTRUCTOR && session.user.role !== Role.ADMIN)) {
    return { error: "دسترسی غیرمجاز." };
  }
  const userId = session.user.id;

  try {
    const date = formData.get("date") as string;
    const startTime = formData.get("startTime") as string; // e.g., "09:00"
    const endTime = formData.get("endTime") as string;   // e.g., "17:00"
    
    if (!date || !startTime || !endTime) {
      return { error: "تاریخ و ساعات شروع و پایان الزامی است." };
    }

    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);
    
    if (startDateTime >= endDateTime || startDateTime < new Date()) {
        return { error: "بازه زمانی نامعتبر است." };
    }

    const slotsToCreate = [];
    let currentSlotStart = startDateTime;

    while (currentSlotStart < endDateTime) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + 60 * 60 * 1000); // 1 hour slots
      if (currentSlotEnd > endDateTime) break;

      slotsToCreate.push({
        mentorId: userId,
        startTime: currentSlotStart,
        endTime: currentSlotEnd,
      });
      currentSlotStart = currentSlotEnd;
    }
    
    if (slotsToCreate.length === 0) {
        return { error: "هیچ بازه زمانی کاملی در این محدوده یافت نشد." };
    }

    await db.timeSlot.createMany({
      data: slotsToCreate,
      skipDuplicates: true, // از ایجاد بازه‌های تکراری جلوگیری می‌کند
    });
    
    revalidatePath("/dashboard/mentorship");
    return { success: `${slotsToCreate.length} بازه زمانی جدید با موفقیت ایجاد شد.` };

  } catch (error) {
    console.error("[CREATE_TIME_SLOTS_ERROR]", error);
    return { error: "خطایی در ایجاد بازه‌های زمانی رخ داد." };
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
      const slotToDelete = await db.timeSlot.findUnique({
        where: { id: timeSlotId },
      });
  
      if (!slotToDelete || slotToDelete.mentorId !== userId) {
        return { error: "بازه زمانی یافت نشد یا شما مالک آن نیستید." };
      }
  
      if (slotToDelete.status === 'BOOKED') {
        return { error: "نمی‌توانید بازه زمانی رزرو شده را حذف کنید." };
      }
  
      await db.timeSlot.delete({
        where: { id: timeSlotId },
      });
  
      revalidatePath("/dashboard/mentorship");
      return { success: "بازه زمانی با موفقیت حذف شد." };
    } catch (error) {
      console.error("[DELETE_TIME_SLOT_ERROR]", error);
      return { error: "خطایی در حذف بازه زمانی رخ داد." };
    }
  };
  // این کد را به انتهای فایل actions/mentorship-actions.ts اضافه کنید

import { createPaymentRequest } from "@/lib/payment/payment-service";

/**
 * یک درخواست رزرو برای یک جلسه منتورشیپ ایجاد کرده و کاربر را به درگاه پرداخت هدایت می‌کند
 */
// در فایل actions/mentorship-actions.ts
// در فایل actions/mentorship-actions.ts
// فقط تابع createMentorshipBooking را با این نسخه جایگزین کنید

// در فایل actions/mentorship-actions.ts
// فقط تابع createMentorshipBooking را با این نسخه جایگزین کنید

export const createMentorshipBooking = async (timeSlotIds: string[]) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "برای رزرو جلسه ابتدا باید وارد شوید." };
  }
  const studentId = session.user.id;
  const studentEmail = session.user.email;

  if (!timeSlotIds || timeSlotIds.length === 0) {
    return { error: "هیچ بازه زمانی انتخاب نشده است." };
  }

  // +++ شروع اصلاح اصلی برای مدیریت خطا +++
  // یک متغیر برای نگهداری نتیجه تراکنش تعریف می‌کنیم
  let transactionResult; 

  try {
    // مرحله اول: تراکنش دیتابیس
    transactionResult = await db.$transaction(async (prisma) => {
      const timeSlots = await prisma.timeSlot.findMany({
        where: { id: { in: timeSlotIds }, status: "AVAILABLE", startTime: { gte: new Date() } },
        include: { mentor: { select: { name: true, id: true } } },
      });

      if (timeSlots.length !== timeSlotIds.length) {
        throw new Error("یک یا چند بازه زمانی انتخاب شده دیگر در دسترس نیست. لطفاً صفحه را رفرش کنید.");
      }

      const mentorId = timeSlots[0].mentorId;
      const mentorName = timeSlots[0].mentor.name;
      
      const mentorProfile = await prisma.mentorProfile.findUnique({ where: { userId: mentorId } });

      if (!mentorProfile || !mentorProfile.isEnabled || mentorProfile.hourlyRate === null) {
        throw new Error("اطلاعات منتورشیپ برای این مدرس کامل نیست یا این قابلیت غیرفعال است.");
      }

      if (studentId === mentorId) {
        throw new Error("شما نمی‌توانید خودتان را رزرو کنید.");
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

    // مرحله دوم: ایجاد درخواست پرداخت
    const paymentResponse = await createPaymentRequest("zarinpal", {
      userId: studentId,
      email: studentEmail,
      amount: transactionResult.amount,
      purchaseId: transactionResult.purchase.id,
      description: `رزرو ${timeSlotIds.length} جلسه مشاوره با ${transactionResult.mentorName}`,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/verify`,
    });
    
    // اگر درخواست پرداخت به زرین پال ناموفق بود، تراکنش دیتابیس را برگردان
    if (!paymentResponse.success) {
        throw new Error(paymentResponse.error || "خطا در ایجاد درخواست پرداخت.");
    }
    
    return paymentResponse;

  } catch (error: any) {
    console.error("[CREATE_MENTORSHIP_BOOKING_ERROR]", error);

    // اگر خطایی رخ داد (چه در تراکنش و چه در درخواست پرداخت)، بازه‌های زمانی را آزاد کن
    await db.timeSlot.updateMany({
        where: { id: { in: timeSlotIds }, status: 'BOOKED' },
        data: { status: 'AVAILABLE' }
    });
    // رکوردهای purchase و booking ناموفق در دیتابیس باقی می‌مانند که می‌توان بعدا آن‌ها را پاک کرد.
    // مهم آزاد شدن بازه زمانی است.

    return { error: error.message || "خطایی در فرآیند رزرو رخ داد." };
  }
  // +++ پایان اصلاح اصلی +++
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

  // اعتبارسنجی اولیه لینک
  if (!meetingLink.trim() || !meetingLink.startsWith("http")) {
    return { error: "لینک جلسه نامعتبر است." };
  }

  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
    });

    // بررسی اینکه آیا کاربر فعلی، منتور این جلسه است یا خیر
    if (!booking || booking.mentorId !== userId) {
      return { error: "رزرو یافت نشد یا شما منتور این جلسه نیستید." };
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