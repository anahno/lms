// فایل: .../edit/_components/CourseActions.tsx
"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { LearningPath, Role } from "@prisma/client";
import { Trash, CheckCircle, Send, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import axios from "axios";

interface CourseActionsProps {
  initialData: LearningPath;
  learningPathId: string;
  isComplete: boolean;
  userRole?: Role;
}

export const CourseActions = ({
  initialData,
  learningPathId,
  isComplete,
  userRole
}: CourseActionsProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onAction = async (newStatus: "PENDING" | "PUBLISHED" | "DRAFT") => {
    setIsLoading(true);
    try {
      await axios.patch(`/api/learning-paths/${learningPathId}`, { status: newStatus });
      if (newStatus === "PENDING") toast.success("دوره برای بازبینی ارسال شد.");
      if (newStatus === "PUBLISHED") toast.success("دوره با موفقیت منتشر شد.");
      if (newStatus === "DRAFT") toast.success("دوره به حالت پیش‌نویس درآمد.");
      router.refresh();
    } catch {
      toast.error("مشکلی پیش آمد.");
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    setIsLoading(true);
    try {
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

  const isInstructor = userRole === "INSTRUCTOR";
  const isAdmin = userRole === "ADMIN";
  const { status } = initialData;

  return (
    <div className="flex items-center gap-x-2">
      {/* دکمه‌های استاد */}
      {isInstructor && (
        <>
          {status === "DRAFT" && (
            <Button onClick={() => onAction("PENDING")} disabled={isLoading || !isComplete} variant="outline" size="sm">
              <Send className="h-4 w-4 ml-2" /> ارسال برای بازبینی
            </Button>
          )}
          {status === "PENDING" && (
            <Button disabled variant="outline" size="sm">
              <Clock className="h-4 w-4 ml-2" /> در انتظار تایید
            </Button>
          )}
          {status === "PUBLISHED" && (
            <Button onClick={() => onAction("DRAFT")} disabled={isLoading} variant="outline" size="sm">
              <XCircle className="h-4 w-4 ml-2" /> لغو انتشار
            </Button>
          )}
        </>
      )}
      
      {/* دکمه‌های ادمین */}
      {isAdmin && (
        <>
          {status === "PENDING" && (
            <Button onClick={() => onAction("PUBLISHED")} disabled={isLoading || !isComplete} variant="success" size="sm">
              <CheckCircle className="h-4 w-4 ml-2" /> تایید و انتشار
            </Button>
          )}
          {status === "PUBLISHED" && (
            <Button onClick={() => onAction("DRAFT")} disabled={isLoading} variant="outline" size="sm">
              <XCircle className="h-4 w-4 ml-2" /> لغو انتشار
            </Button>
          )}
           {status === "DRAFT" && (
            <Button onClick={() => onAction("PUBLISHED")} disabled={isLoading || !isComplete} variant="success" size="sm">
              <CheckCircle className="h-4 w-4 ml-2" /> انتشار مستقیم (ادمین)
            </Button>
          )}
        </>
      )}

      <ConfirmModal onConfirm={onDelete}>
        <Button size="sm" disabled={isLoading} variant="destructive">
          <Trash className="h-4 w-4" />
        </Button>
      </ConfirmModal>
    </div>
  );
};