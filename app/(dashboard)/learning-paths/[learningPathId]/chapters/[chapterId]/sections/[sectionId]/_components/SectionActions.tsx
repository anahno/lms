// فایل: .../sections/[sectionId]/_components/SectionActions.tsx
"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface SectionActionsProps {
  learningPathId: string;
  chapterId: string;
  sectionId: string;
  isPublished: boolean;
  isComplete: boolean;
}

export const SectionActions = ({
  learningPathId,
  chapterId,
  sectionId,
  isPublished,
  isComplete,
}: SectionActionsProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onPublishToggle = async () => {
    try {
      setIsLoading(true);
      if (isPublished) {
        await axios.patch(`/api/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}`, { isPublished: false });
        toast.success("بخش به حالت پیش‌نویس درآمد.");
      } else {
        await axios.patch(`/api/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}`, { isPublished: true });
        toast.success("بخش با موفقیت منتشر شد.");
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
      await axios.delete(`/api/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}`);
      toast.success("بخش با موفقیت حذف شد.");
      router.refresh();
      // بازگشت به صفحه قبلی (مدیریت فصل) پس از حذف
      router.push(`/learning-paths/${learningPathId}/chapters/${chapterId}`);
    } catch {
      toast.error("مشکلی در حذف بخش پیش آمد.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-x-2">
      <Button onClick={onPublishToggle} disabled={isLoading || !isComplete} variant="outline" size="sm">
        {isPublished ? "لغو انتشار" : "انتشار"}
      </Button>
      <ConfirmModal onConfirm={onDelete}>
        <Button size="sm" disabled={isLoading} variant="destructive">
          <Trash className="h-4 w-4" />
        </Button>
      </ConfirmModal>
    </div>
  );
};