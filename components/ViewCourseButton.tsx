// فایل: components/ViewCourseButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

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
        router.push(result.url);
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
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
      className="rounded-full w-16 h-16 shadow-lg bg-red-500 text-white hover:bg-red-600 transition-all duration-300 ease-in-out transform hover:scale-110"
    >
      {isLoading ? "..." : <Plus className="w-8 h-8" />}
    </Button>
  );
};