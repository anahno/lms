// فایل: components/ViewCourseButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react"; // آیکون برای ورود به دوره

import { getCourseEntryUrl } from "@/actions/go-to-course";
import { Button } from "./ui/button";

interface ViewCourseButtonProps {
  learningPathId: string;
}

export const ViewCourseButton = ({ learningPathId }: ViewCourseButtonProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const result = await getCourseEntryUrl(learningPathId);

      if (result.url) {
        // اگر URL معتبر بود، کاربر را هدایت کن
        router.push(result.url);
      } else if (result.error) {
        // اگر خطایی وجود داشت، آن را نمایش بده
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("یک خطای ناشناخته رخ داد.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={isLoading} size="sm">
      {isLoading ? "در حال ورود..." : "ورود به دوره"}
      <ArrowLeft className="h-4 w-4 mr-2" />
    </Button>
  );
};