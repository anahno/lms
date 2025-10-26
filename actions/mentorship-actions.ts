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
export const updateMentorProfile = async (data: {
  isEnabled: boolean;
  hourlyRate?: number;
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
        hourlyRate: data.hourlyRate ? Number(data.hourlyRate) : null,
        mentorshipDescription: data.mentorshipDescription,
      },
      create: {
        userId,
        isEnabled: data.isEnabled,
        hourlyRate: data.hourlyRate ? Number(data.hourlyRate) : null,
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