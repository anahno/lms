// فایل: app/courses/_components/LoginOrPurchaseModal.tsx
"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface LoginOrPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  price: number | null;
}

export const LoginOrPurchaseModal = ({ isOpen, onClose, courseId, price }: LoginOrPurchaseModalProps) => {
  const router = useRouter();
  const isFree = !price || price <= 0;

  const handleRedirect = () => {
    // کاربر را به صفحه لاگین با یک callbackUrl به صفحه اصلی دوره هدایت می‌کنیم
    router.push(`/login?callbackUrl=/courses/${courseId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="p-3 bg-amber-100 rounded-full mb-4">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
          <DialogTitle className="text-2xl font-bold">این محتوا قفل است</DialogTitle>
          <DialogDescription className="text-base">
            برای دسترسی به این بخش و تمام محتوای دوره، ابتدا باید وارد حساب کاربری خود شوید و در دوره ثبت‌نام کنید.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          {isFree ? (
            <Button size="lg" onClick={handleRedirect}>
              ورود / ثبت‌نام برای مشاهده رایگان
            </Button>
          ) : (
            <Button size="lg" onClick={handleRedirect}>
              ورود برای خرید دوره
            </Button>
          )}
          <Button size="lg" variant="outline" onClick={onClose}>
            بازگشت
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
