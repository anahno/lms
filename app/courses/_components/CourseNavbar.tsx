// فایل: app/courses/_components/CourseNavbar.tsx
"use client";

import type { LearningPathWithStructure } from "@/lib/types";

interface CourseNavbarProps {
  learningPath: LearningPathWithStructure;
  progressCount: number;
  children: React.ReactNode; // برای دریافت دکمه منوی موبایل
}

export const CourseNavbar = ({
  learningPath,
 // progressCount,
  children,
}: CourseNavbarProps) => {
  return (
    <div className="p-4 border-b h-full flex items-center bg-white shadow-sm">
      {/* دکمه منو (برای موبایل) از والدش اینجا قرار می‌گیرد */}
      {children}
      
      <h1 className="font-semibold text-lg flex-1">{learningPath.title}</h1>

      {/* می‌توانید سایر عناصر نوار ناوبری مانند پیشرفت یا دکمه اشتراک‌گذاری را اینجا اضافه کنید */}
    </div>
  );
};