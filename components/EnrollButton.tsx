// فایل: components/EnrollButton.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

import { enrollInCourse } from "@/actions/enroll-course";
import { createPaymentRequest } from "@/actions/payment-actions";
import { Button } from "./ui/button";

interface EnrollButtonProps {
  learningPathId: string;
  price: number | null | undefined;
  context?: "catalog" | "landing";
}

export const EnrollButton = ({ learningPathId, price, context = "landing" }: EnrollButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isFree = !price || price <= 0;
  const buttonLabel = isFree ? "ثبت‌نام رایگان در دوره" : "خرید دوره";

  const handleClick = () => {
    if (context === "catalog") {
      // +++ اصلاح شد: استفاده از بک‌تیک (`) برای ساخت رشته URL +++
      router.push(`/courses/${learningPathId}`);
      return;
    }

    startTransition(async () => {
      try {
        if (isFree) {
          const result = await enrollInCourse(learningPathId);
          if (result.success) {
            toast.success(result.success);
            router.refresh();
          } else if (result.error) {
            if (result.error === "برای ثبت‌نام ابتدا باید وارد شوید.") {
              toast.error(result.error);
              router.push(`/login?callbackUrl=/courses/${learningPathId}`);
            } else {
              toast.error(result.error);
            }
          }
        } else {
          const result = await createPaymentRequest(learningPathId);
          if (result.success && result.url) {
            toast.loading("در حال انتقال به درگاه پرداخت...");
            window.location.href = result.url;
          } else if (result.error) {
            if (result.error === "برای خرید دوره ابتدا باید وارد شوید.") {
              toast.error(result.error);
              router.push(`/login?callbackUrl=/courses/${learningPathId}`);
            } else {
              toast.error(result.error);
            }
          }
        }
      } catch {
        toast.error("یک خطای ناشناخته در سرور رخ داد.");
      }
    });
  };

  return (
    <Button 
      onClick={handleClick} 
      disabled={isPending} 
      size="icon-lg"
      className="rounded-full w-16 h-16 shadow-lg bg-sky-500 text-white hover:bg-sky-600 transition-all duration-300 ease-in-out transform hover:scale-110"
      aria-label={buttonLabel}
    >
      {isPending ? (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      ) : (
        <Plus className="w-8 h-8" />
      )}
    </Button>
  );
};