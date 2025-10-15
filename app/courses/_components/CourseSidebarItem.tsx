// فایل: app/courses/_components/CourseSidebarItem.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import toast from "react-hot-toast";
import { Check, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleSectionCompletion } from "@/actions/progress"; // اکشن سرور برای تغییر وضعیت

interface CourseSidebarItemProps {
  id: string; // sectionId
  label: string;
  duration: number | null;
  isCompleted: boolean;
  learningPathId: string;
}

// تابع کمکی برای فرمت کردن زمان
const formatDuration = (seconds: number | null) => {
  if (seconds === null || isNaN(seconds)) return "";
  const minutes = Math.floor(seconds / 60);
  if (minutes === 0) return "کمتر از ۱ دقیقه";
  return `${minutes} دقیقه`;
};

export const CourseSidebarItem = ({
  id,
  label,
  duration,
  isCompleted,
  learningPathId,
}: CourseSidebarItemProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isActive = pathname?.includes(id);

  const handleItemClick = () => {
    router.push(`/courses/${learningPathId}/sections/${id}`);
  };

  const handleProgressToggle = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // جلوگیری از اینکه کلیک روی چک‌باکس باعث ناوبری شود
    startTransition(async () => {
      const result = await toggleSectionCompletion(id, learningPathId, isCompleted);
      if (result.success) {
        toast.success("وضعیت پیشرفت به‌روز شد.");
        router.refresh(); // رفرش کردن داده‌های سرور
      } else {
        toast.error(result.error || "مشکلی پیش آمد.");
      }
    });
  };

  return (
    // کل آیتم یک دکمه برای ناوبری است
    <button
      onClick={handleItemClick}
      type="button"
      className={cn(
        "flex w-full items-center gap-x-3 text-right p-4 transition-colors",
        isActive ? "bg-sky-100/50 text-sky-800" : "hover:bg-slate-100",
        isCompleted && !isActive && "text-emerald-700 hover:text-emerald-800",
        isPending && "opacity-75 cursor-not-allowed"
      )}
      disabled={isPending}
    >
      {/* 1. چک‌باکس سفارشی */}
      <div
        onClick={handleProgressToggle}
        className={cn(
          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-sm border-2 transition-all",
          isCompleted
            ? "border-emerald-600 bg-emerald-600 text-white"
            : "border-slate-400 bg-white group-hover:border-slate-700",
          isActive && !isCompleted && "border-sky-700"
        )}
      >
        {isCompleted && <Check className="h-3 w-3" />}
      </div>

      {/* 2. محتوای اصلی آیتم */}
      <div className="flex-1">
        <div className="text-sm font-medium leading-snug">{label}</div>
        <div className="mt-1 flex items-center gap-x-1.5 text-xs text-slate-500">
          <PlayCircle className="h-3.5 w-3.5" />
          <span>{formatDuration(duration)}</span>
        </div>
      </div>
    </button>
  );
};