// فایل: app/courses/_components/CourseSidebarItem.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import toast from "react-hot-toast";
import { Check, PlayCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleSectionCompletion } from "@/actions/progress";

interface CourseSidebarItemProps {
  id: string; // sectionId
  label: string;
  duration: number | null;
  isCompleted: boolean;
  learningPathId: string;
  quizId?: string; // پراپرتی جدید
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
  quizId,
}: CourseSidebarItemProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isActiveSection = pathname?.includes(`/sections/${id}`);
  const isActiveQuiz = quizId ? pathname?.includes(`/quiz/${quizId}`) : false;

  const handleItemClick = () => {
    router.push(`/courses/${learningPathId}/sections/${id}`);
  };

  const handleProgressToggle = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
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
    <>
      <button
        onClick={handleItemClick}
        type="button"
        className={cn(
          "flex w-full items-center gap-x-3 text-right p-4 transition-colors",
          isActiveSection ? "bg-sky-100/50 text-sky-800" : "hover:bg-slate-100",
          isCompleted && !isActiveSection && "text-emerald-700 hover:text-emerald-800",
          isPending && "opacity-75 cursor-not-allowed"
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
            isActiveSection && !isCompleted && "border-sky-700"
          )}
        >
          {isCompleted && <Check className="h-3 w-3" />}
        </div>

        <div className="flex-1">
          <div className="text-sm font-medium leading-snug">{label}</div>
          <div className="mt-1 flex items-center gap-x-1.5 text-xs text-slate-500">
            <PlayCircle className="h-3.5 w-3.5" />
            <span>{formatDuration(duration)}</span>
          </div>
        </div>
      </button>

      {quizId && (
        <button
          onClick={() => router.push(`/courses/${learningPathId}/quiz/${quizId}`)}
          type="button"
          className={cn(
            "flex w-full items-center gap-x-3 text-right py-3 pr-12 pl-4 text-sm transition-colors",
            isActiveQuiz ? "bg-amber-100/50 text-amber-800 font-semibold" : "hover:bg-slate-100 text-slate-600"
          )}
        >
          <HelpCircle className="h-4 w-4" />
          آزمون این بخش
        </button>
      )}
    </>
  );
};