// فایل: .../edit/_components/CourseActions.tsx
"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { LearningPath } from "@prisma/client";
import { Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface CourseActionsProps {
  initialData: LearningPath;
  learningPathId: string;
  isComplete: boolean; // آیا دوره برای انتشار آماده است؟
}

export const CourseActions = ({
  initialData,
  learningPathId,
  isComplete,
}: CourseActionsProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onPublishToggle = async () => {
    try {
      setIsLoading(true);
      if (initialData.isPublished) {
        await axios.patch(`/api/learning-paths/${learningPathId}`, { isPublished: false });
        toast.success("دوره به حالت پیش‌نویس درآمد.");
      } else {
        await axios.patch(`/api/learning-paths/${learningPathId}`, { isPublished: true });
        toast.success("دوره با موفقیت منتشر شد.");
      }
      router.refresh();
    } catch {
      toast.error("مشکلی پیش آمد.");
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/learning-paths/${learningPathId}`);
      toast.success("دوره با موفقیت حذف شد.");
      router.refresh();
      router.push("/");
    } catch {
      toast.error("مشکلی در حذف دوره پیش آمد.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-x-2">
      <Button
        onClick={onPublishToggle}
        disabled={isLoading || !isComplete} // دکمه انتشار غیرفعال است اگر دوره کامل نباشد
        variant="outline"
        size="sm"
      >
        {initialData.isPublished ? "لغو انتشار" : "انتشار"}
      </Button>
      <ConfirmModal onConfirm={onDelete}>
        <Button size="sm" disabled={isLoading} variant="destructive">
          <Trash className="h-4 w-4" />
        </Button>
      </ConfirmModal>
    </div>
  );
};