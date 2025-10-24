// فایل: app/courses/_components/CourseSidebarItem.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import toast from "react-hot-toast";
import { Check, PlayCircle, Lock } from "lucide-react"; // +++ ۱. آیکون Lock وارد شد +++
import { cn } from "@/lib/utils";
import { toggleSectionCompletion } from "@/actions/progress";

interface CourseSidebarItemProps {
  id: string; // sectionId
  label: string;
  duration: number | null;
  isCompleted: boolean;
  learningPathId: string;
  isFree: boolean;
  isChapterFree: boolean;
  isEnrolled: boolean;
  onOpenModal: () => void;
}

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
  isFree,
  isChapterFree,
  isEnrolled,
  onOpenModal,
}: CourseSidebarItemProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isActive = pathname?.includes(`/sections/${id}`);
  const isLocked = !isEnrolled && !isFree && !isChapterFree;

  const handleItemClick = () => {
    if (isLocked) {
      onOpenModal();
    } else {
      router.push(`/courses/${learningPathId}/sections/${id}`);
    }
  };

  const handleProgressToggle = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (isLocked) {
      onOpenModal();
      return;
    }
    startTransition(async () => {
      const result = await toggleSectionCompletion(id, learningPathId, isCompleted);
      if (result.success) {
        toast.success("وضعیت پیشرفت به‌روز شد.");
        router.refresh();
      } else {
        toast.error(result.error || "مشکلی پیش آمد.");
      }
    });
  };

  return (
    <button
      onClick={handleItemClick}
      type="button"
      className={cn(
        "flex w-full items-center gap-x-3 text-right p-4 transition-colors",
        isActive ? "bg-sky-100/50 text-sky-800" : "hover:bg-slate-100",
        isCompleted && !isActive && "text-emerald-700 hover:text-emerald-800",
        isPending && "opacity-75 cursor-not-allowed",
        isLocked && "text-slate-500 hover:bg-slate-50"
      )}
      disabled={isPending}
    >
      <div
        onClick={handleProgressToggle}
        className={cn(
          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-sm border-2 transition-all",
          isCompleted
            ? "border-emerald-600 bg-emerald-600 text-white"
            : "border-slate-400 bg-white group-hover:border-slate-700",
          isActive && !isCompleted && "border-sky-700",
          // +++ ۲. استایل مخصوص حالت قفل شده +++
          isLocked && "bg-slate-100 border-slate-300 text-slate-500 cursor-pointer"
        )}
      >
        {/* +++ ۳. منطق جدید برای نمایش آیکون‌ها +++ */}
        {isCompleted ? (
          <Check className="h-3 w-3" />
        ) : isLocked ? (
          <Lock className="h-3 w-3" />
        ) : null}
      </div>

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