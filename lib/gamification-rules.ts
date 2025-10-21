// فایل: lib/gamification-rules.ts

// ۱. تعریف انواع رویدادهایی که امتیاز دارند
export const XP_EVENTS = {
  COMPLETE_SECTION: "COMPLETE_SECTION",
  QUIZ_PASSED: "QUIZ_PASSED", // نمره بالای یک حد مشخص
  QUIZ_PERFECT_SCORE: "QUIZ_PERFECT_SCORE", // نمره ۱۰۰
  ASK_QUESTION: "ASK_QUESTION",
  RECEIVE_INSTRUCTOR_REPLY: "RECEIVE_INSTRUCTOR_REPLY",
} as const; // "as const" برای type safety بهتر

export type XpEvent = typeof XP_EVENTS[keyof typeof XP_EVENTS];

// ۲. تعریف مقدار امتیاز برای هر رویداد
export const XP_POINTS: Record<XpEvent, number> = {
  [XP_EVENTS.COMPLETE_SECTION]: 10,
  [XP_EVENTS.QUIZ_PASSED]: 25,
  [XP_EVENTS.QUIZ_PERFECT_SCORE]: 50, // امتیاز اضافی برای نمره کامل
  [XP_EVENTS.ASK_QUESTION]: 5,
  [XP_EVENTS.RECEIVE_INSTRUCTOR_REPLY]: 15,
};

// ۳. فرمول محاسبه سطح کاربر
// این فرمول می‌گوید برای رسیدن به هر سطح، به ۱۰۰ امتیاز بیشتر از سطح قبلی نیاز است
// سطح ۱: ۰ امتیاز | سطح ۲: ۱۰۰ امتیاز | سطح ۳: ۳۰۰ امتیاز | سطح ۴: ۶۰۰ امتیاز و ...
export const getLevelFromXP = (xp: number): number => {
  if (xp < 100) return 1;
  // این یک فرمول ساده برای رشد نمایی مورد نیاز XP است
  return Math.floor((1 + Math.sqrt(1 + 8 * xp / 100)) / 2);
};

export const getXPForLevel = (level: number): number => {
    if (level <= 1) return 0;
    return (level * (level - 1) * 100) / 2;
}