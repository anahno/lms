// فایل: actions/get-dropoff-stats.ts
"use server";

import { db } from "@/lib/db";

// نوع خروجی برای نمودار قیفی بدون تغییر باقی می‌ماند
export type FunnelStat = {
  sectionId: string;
  sectionTitle: string;
  studentCount: number; // تعداد دانشجویانی که به این بخش رسیده‌اند
};

export const getDropOffStats = async (
  learningPathId: string
): Promise<FunnelStat[]> => {
  try {
    // ۱. تمام بخش‌های منتشر شده دوره را به ترتیب صحیح واکشی می‌کنیم
    const orderedSections = await db.section.findMany({
      where: {
        isPublished: true,
        chapter: {
          isPublished: true,
          level: { learningPathId: learningPathId },
        },
      },
      select: { id: true, title: true },
      orderBy: [
        { chapter: { level: { position: "asc" } } },
        { chapter: { position: "asc" } },
        { position: "asc" },
      ],
    });

    if (orderedSections.length === 0) {
      return [];
    }
    const orderedSectionIds = orderedSections.map(s => s.id);

    // ۲. تعداد کل دانشجویان ثبت‌نام کرده را پیدا می‌کنیم
    const totalEnrollments = await db.enrollment.count({
      where: { learningPathId },
    });
    
    if (totalEnrollments === 0) {
        return [];
    }
    
    // --- شروع منطق جدید و اصلاح شده ---

    // ۳. تمام ثبت‌نام‌ها را به همراه بخش‌های تکمیل شده توسط هر کاربر واکشی می‌کنیم
    const enrollments = await db.enrollment.findMany({
        where: { learningPathId },
        select: {
            user: {
                select: {
                    id: true,
                    progress: {
                        where: { isCompleted: true, sectionId: { in: orderedSectionIds } },
                        select: { sectionId: true }
                    }
                }
            }
        }
    });

    // ۴. یک Map برای شمارش تعداد کاربرانی که در هر بخش توقف کرده‌اند (نقطه ریزش) ایجاد می‌کنیم
    const dropOffCounts = new Map<string, number>();
    orderedSections.forEach(s => dropOffCounts.set(s.id, 0));

    // ۵. برای هر دانشجو، نقطه ریزش او را در کد جاوا اسکریپت پیدا می‌کنیم
    for (const enrollment of enrollments) {
        const completedSectionIds = new Set(enrollment.user.progress.map(p => p.sectionId));

        // اگر کاربر هیچ درسی را تکمیل نکرده یا تمام دوره را تکمیل کرده، نقطه ریزش ندارد
        if (completedSectionIds.size === 0 || completedSectionIds.size >= orderedSections.length) {
            continue;
        }

        let lastCompletedIndex = -1;
        // آخرین ایندکس از بخش‌های مرتب شده دوره که کاربر آن را تکمیل کرده پیدا می‌کنیم
        for (let i = 0; i < orderedSections.length; i++) {
            if (completedSectionIds.has(orderedSections[i].id)) {
                lastCompletedIndex = i;
            }
        }

        // اگر آخرین بخش تکمیل شده، آخرین بخش کل دوره نباشد، آن را به عنوان نقطه ریزش ثبت می‌کنیم
        if (lastCompletedIndex !== -1 && lastCompletedIndex < orderedSections.length - 1) {
            const dropOffSectionId = orderedSections[lastCompletedIndex].id;
            dropOffCounts.set(dropOffSectionId, (dropOffCounts.get(dropOffSectionId) || 0) + 1);
        }
    }
    
    // --- پایان منطق جدید و اصلاح شده ---


    // ۶. داده‌ها را به فرمت قیفی تبدیل می‌کنیم (این بخش بدون تغییر باقی می‌ماند)
    let remainingStudents = totalEnrollments;
    const funnelStats: FunnelStat[] = [];

    for (const section of orderedSections) {
        funnelStats.push({
            sectionId: section.id,
            sectionTitle: section.title,
            studentCount: remainingStudents,
        });
        const droppedOff = dropOffCounts.get(section.id) || 0;
        remainingStudents -= droppedOff;
    }

    return funnelStats;

  } catch (error) {
    console.error("[GET_FUNNEL_STATS_ERROR]", error);
    return [];
  }
};