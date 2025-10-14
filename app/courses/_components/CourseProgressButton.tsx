"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleSectionCompletion } from "@/actions/progress";

interface CourseProgressButtonProps {
  sectionId: string;
  learningPathId: string;
  nextSectionId?: string;
  isCompleted: boolean;
}

export const CourseProgressButton = ({
  sectionId,
  learningPathId,
  nextSectionId,
  isCompleted,
}: CourseProgressButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const Icon = isCompleted ? XCircle : CheckCircle;
  const buttonText = isCompleted ? "تکمیل نشده" : "علامت‌گذاری به عنوان تکمیل شده";

  const onClick = () => {
    startTransition(async () => {
      const result = await toggleSectionCompletion(sectionId, learningPathId, isCompleted);
      
      if (result.success) {
        toast.success("وضعیت پیشرفت به‌روز شد.");
        if (!isCompleted && nextSectionId) {
          router.push(`/courses/${learningPathId}/sections/${nextSectionId}`);
        }
        router.refresh();
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