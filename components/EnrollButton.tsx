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
        // --- شروع تغییر کلیدی ---
        // بررسی می‌کنیم که آیا خطا مربوط به عدم ورود کاربر است یا نه
        if (result.error === "برای ثبت‌نام ابتدا باید وارد شوید.") {
          toast.error(result.error); // پیام را نمایش می‌دهیم
          router.push("/login"); // و کاربر را به صفحه ورود هدایت می‌کنیم
        } else {
          // برای سایر خطاها، فقط پیام را نمایش می‌دهیم
          toast.error(result.error);
        }
        // --- پایان تغییر کلیدی ---
      }
    } catch {
      toast.error("یک خطای ناشناخته در سرور رخ داد.");
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