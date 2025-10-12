// فایل: .../_components/CourseProgressButton.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

import { toggleChapterCompletion } from "@/actions/progress"; // وارد کردن Server Action

interface CourseProgressButtonProps {
  chapterId: string;
  learningPathId: string;
  nextChapterId?: string;
  isCompleted: boolean;
}

export const CourseProgressButton = ({
  chapterId,
  learningPathId,
  nextChapterId,
  isCompleted,
}: CourseProgressButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const Icon = isCompleted ? XCircle : CheckCircle;
  const buttonText = isCompleted ? "تکمیل نشده" : "علامت‌گذاری به عنوان تکمیل شده";

  const onClick = () => {
    startTransition(async () => {
      const result = await toggleChapterCompletion(chapterId, learningPathId, isCompleted);
      
      if (result.success) {
        toast.success("وضعیت پیشرفت به‌روز شد.");
        if (!isCompleted && nextChapterId) {
          router.push(`/courses/${learningPathId}/chapters/${nextChapterId}`);
        }
      } else {
        toast.error("مشکلی پیش آمد.");
      }
    });
  };

  return (
    <Button
      onClick={onClick}
      disabled={isPending}
      type="button"
      variant={isCompleted ? "outline" : "success"}
      className="w-full md:w-auto"
    >
      {buttonText}
      <Icon className="h-4 w-4 mr-2" />
    </Button>
  );
};