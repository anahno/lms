// فایل جدید: app/courses/_components/CourseQuizItem.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseQuizItemProps {
  quizId: string;
  courseSlug: string; // +++ ۱. نام پراپ به courseSlug تغییر کرد
}

export const CourseQuizItem = ({ quizId, courseSlug }: CourseQuizItemProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = pathname?.includes(`/quiz/${quizId}`);

  return (
    <button
      // +++ ۲. از courseSlug در URL استفاده می‌شود +++
      onClick={() => router.push(`/courses/${courseSlug}/quiz/${quizId}`)}
      type="button"
      className={cn(
        "flex w-full items-center gap-x-3 text-right py-3 pr-12 pl-4 text-sm transition-colors",
        isActive
          ? "bg-amber-100/50 text-amber-800 font-semibold"
          : "hover:bg-slate-100 text-slate-600"
      )}
    >
      <HelpCircle className="h-4 w-4" />
      آزمون این بخش
    </button>
  );
};