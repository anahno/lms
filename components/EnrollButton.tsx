// فایل: components/EnrollButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

import { enrollInCourse } from "@/actions/enroll-course";
import { Button } from "./ui/button";

interface EnrollButtonProps {
  learningPathId: string;
}

export const EnrollButton = ({ learningPathId }: EnrollButtonProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const result = await enrollInCourse(learningPathId);

      if (result.success) {
        toast.success(result.success);
        router.refresh(); // برای به‌روزرسانی UI و نمایش دکمه "مشاهده"
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("یک خطای ناشناخته رخ داد.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleClick} 
      disabled={isLoading} 
      size="icon-lg"
      className="rounded-full w-16 h-16 shadow-lg bg-sky-500 text-white hover:bg-sky-600 transition-all duration-300 ease-in-out transform hover:scale-110"
      aria-label="ثبت‌نام در دوره"
    >
      {isLoading ? "..." : <Plus className="w-8 h-8" />}
    </Button>
  );
};