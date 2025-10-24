// فایل: components/EnrollButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Play } from "lucide-react"; // --- آیکون به Play تغییر کرد ---

import { getCourseEntryUrl } from "@/actions/go-to-course"; // --- از اکشن صحیح استفاده می‌کنیم ---
import { Button } from "./ui/button";

interface EnrollButtonProps {
  learningPathId: string;
  price: number | null | undefined;
}

export const EnrollButton = ({ learningPathId }: EnrollButtonProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // --- منطق کاملاً تغییر کرد ---
  const handleClick = async () => {
    setIsLoading(true);
    try {
      // اکشن سروری را برای گرفتن آدرس اولین درس فراخوانی می‌کنیم
      const result = await getCourseEntryUrl(learningPathId);

      if (result.url) {
        // کاربر را مستقیماً به آدرس اولین درس هدایت می‌کنیم
        router.push(result.url);
      } else if (result.error) {
        toast.error(result.error);
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
      aria-label="ورود به دوره"
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      ) : (
        <Play className="w-8 h-8 fill-white" />
      )}
    </Button>
  );
};