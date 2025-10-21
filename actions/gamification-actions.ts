// فایل: actions/gamification-actions.ts
"use server";

import { db } from "@/lib/db";
import { XpEvent, XP_POINTS, getLevelFromXP } from "@/lib/gamification-rules";

/**
 * بررسی می‌کند که آیا کاربر شرایط دریافت نشان‌های جدید را دارد یا خیر
 * و در صورت داشتن شرایط، نشان را به او اعطا می‌کند.
 */
// +++ اصلاح اصلی در اینجا: کلمه export اضافه شده است +++
// +++ این تابع را موقتاً با نسخه زیر جایگزین کنید +++
export const checkAndAwardBadges = async (userId: string) => {
  console.log(`\n--- [DEBUG] START: Checking badges for user ${userId} ---`);
  try {
    const userWithProgress = await db.user.findUnique({
      where: { id: userId },
      include: {
        enrollments: { select: { id: true } },
        progress: { where: { isCompleted: true }, select: { id: true } },
        discussions: { where: { parentId: null }, select: { id: true } },
        badges: { select: { badge: { select: { name: true } } } },
      },
    });

    if (!userWithProgress) {
      console.log("[DEBUG] User not found. Exiting.");
      return;
    }

    const userBadgeNames = userWithProgress.badges.map(b => b.badge.name);
    console.log("[DEBUG] User currently has these badges:", userBadgeNames);

    const badgesToAward: string[] = [];

    // شرط ۱: ثبت‌نام در اولین دوره
    console.log(`[DEBUG] Enrollments count: ${userWithProgress.enrollments.length}`);
    if (userWithProgress.enrollments.length >= 1 && !userBadgeNames.includes("دانشجوی تازه‌وارد")) {
      console.log("[DEBUG] Condition MET: 'دانشجوی تازه‌وارد'");
      badgesToAward.push("دانشجوی تازه‌وارد");
    }

    // شرط ۲: تکمیل اولین درس
    console.log(`[DEBUG] Completed sections count: ${userWithProgress.progress.length}`);
    if (userWithProgress.progress.length >= 1 && !userBadgeNames.includes("شروع قدرتمند")) {
      console.log("[DEBUG] Condition MET: 'شروع قدرتمند'");
      badgesToAward.push("شروع قدرتمند");
    }
    
    // شرط ۳: پرسیدن اولین سوال
    console.log(`[DEBUG] Questions asked count: ${userWithProgress.discussions.length}`);
    if (userWithProgress.discussions.length >= 1 && !userBadgeNames.includes("کنجکاو")) {
      console.log("[DEBUG] Condition MET: 'کنجکاو'");
      badgesToAward.push("کنجکاو");
    }

    // شرط ۴: تکمیل ۱۰ درس
    if (userWithProgress.progress.length >= 10 && !userBadgeNames.includes("کوشا")) {
        console.log("[DEBUG] Condition MET: 'کوشا'");
        badgesToAward.push("کوشا");
    }
    
    console.log("[DEBUG] Badges to be awarded:", badgesToAward);

    // اگر نشانی برای اعطا وجود داشت
    if (badgesToAward.length > 0) {
      const badgesFromDB = await db.badge.findMany({
        where: { name: { in: badgesToAward } },
      });
      console.log("[DEBUG] Found badges in DB to award:", badgesFromDB.map(b => b.name));

      for (const badge of badgesFromDB) {
        const existingUserBadge = await db.userBadge.findUnique({
          where: { userId_badgeId: { userId: userId, badgeId: badge.id } }
        });
        
        if (!existingUserBadge) {
          await db.userBadge.create({
            data: { userId: userId, badgeId: badge.id },
          });
          console.log(`[SUCCESS] User ${userId} received badge: ${badge.name}`);
        } else {
          console.log(`[DEBUG] User already has badge: ${badge.name}. Skipping.`);
        }
      }
    }
  } catch (error) {
    console.error("[FATAL_ERROR in checkAndAwardBadges]", error);
  } finally {
    console.log("--- [DEBUG] END: Badge check finished ---\n");
  }
};



/**
 * به یک کاربر بر اساس یک رویداد خاص، امتیاز تجربه (XP) اعطا می‌کند
 * و در صورت نیاز، سطح او را ارتقا می‌دهد.
 */
export const grantExperiencePoints = async (userId: string, event: XpEvent) => {
  try {
    const pointsToAdd = XP_POINTS[event];
    if (!pointsToAdd) {
      console.warn(`[GRANT_XP_WARN] No points defined for event: ${event}`);
      return;
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { experiencePoints: { increment: pointsToAdd } },
    });

    const newLevel = getLevelFromXP(updatedUser.experiencePoints);

    if (newLevel > updatedUser.level) {
      await db.user.update({
        where: { id: userId },
        data: { level: newLevel },
      });
      console.log(`[LEVEL_UP] User ${userId} reached Level ${newLevel}!`);
    }
    
    // فراخوانی تابع بررسی نشان‌ها در انتهای عملیات امتیازدهی
    await checkAndAwardBadges(userId);

    return { success: true };
  } catch (error) {
    console.error("[GRANT_XP_ERROR]", error);
    return { success: false, error: "Failed to grant experience points." };
  }
};