// فایل: app/courses/_components/InlineRating.tsx
"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Rating } from "@/components/ui/rating";
import { rateSection } from "@/actions/rate-section";

interface InlineRatingProps {
  sectionId: string;
  learningPathId: string;
  initialRating: number | null;
  isCompleted: boolean;
}

export const InlineRating = ({
  sectionId,
  learningPathId,
  initialRating,
  isCompleted,
}: InlineRatingProps) => {
  // از یک state محلی برای قفل کردن کامپوننت بعد از اولین رای استفاده می‌کنیم
  const [currentRating, setCurrentRating] = useState(initialRating);
  const [isPending, startTransition] = useTransition();

  const handleRatingChange = (newRating: number) => {
    startTransition(async () => {
      const result = await rateSection(sectionId, learningPathId, newRating);
      if (result.success) {
        toast.success(result.success);
        setCurrentRating(newRating); // امتیاز را در state محلی ذخیره می‌کنیم تا کامپوننت قفل شود
      } else {
        toast.error(result.error || "خطایی رخ داد.");
      }
    });
  };

  // اگر درس تکمیل نشده، چیزی نمایش نده
  if (!isCompleted) {
    return null;
  }

  // اگر کاربر قبلاً امتیاز داده (چه در بارگذاری اولیه چه همین الان)
  if (currentRating) {
    return (
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">شما قبلا امتیاز داده اید</p>
        {/* کامپوننت Rating بدون onRatingChange غیرقابل کلیک است */}
        <Rating rating={currentRating} size={18} />
      </div>
    );
  }

  // اگر هنوز امتیاز نداده
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground mb-1">به این درس امتیاز دهید</p>
      <Rating
        rating={0}
        onRatingChange={handleRatingChange}
        size={18}
      />
      {isPending && <p className="text-xs text-muted-foreground animate-pulse">در حال ثبت...</p>}
    </div>
  );
};