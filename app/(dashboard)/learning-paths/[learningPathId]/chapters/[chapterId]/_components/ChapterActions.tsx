// فایل: .../chapters/[chapterId]/_components/ChapterActions.tsx
"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Chapter } from "@prisma/client";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface ChapterActionsProps {
  initialData: Chapter;
  learningPathId: string;
  chapterId: string;
}

export const ChapterActions = ({
  initialData,
  learningPathId,
  chapterId,
}: ChapterActionsProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // تابع برای تغییر وضعیت انتشار
  const onPublishToggle = async () => {
    try {
      setIsLoading(true);
      if (initialData.isPublished) {
        await axios.patch(`/api/learning-paths/${learningPathId}/chapters/${chapterId}`, { isPublished: false });
        toast.success("فصل به حالت پیش‌نویس درآمد.");
      } else {
        await axios.patch(`/api/learning-paths/${learningPathId}/chapters/${chapterId}`, { isPublished: true });
        toast.success("فصل با موفقیت منتشر شد.");
      }
      router.refresh();
    } catch {
      toast.error("مشکلی پیش آمد.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // تابع برای حذف فصل
  const onDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/learning-paths/${learningPathId}/chapters/${chapterId}`);
      toast.success("فصل با موفقیت حذف شد.");
      router.refresh();
      // بازگشت به صفحه قبلی پس از حذف
      router.push(`/learning-paths/${learningPathId}/edit`);
    } catch {
      toast.error("مشکلی در حذف فصل پیش آمد.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-x-2">
      <Button onClick={onPublishToggle} disabled={isLoading} variant="outline" size="sm">
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