// فایل: app/(dashboard)/learning-paths/[learningPathId]/edit/_components/DiscountPriceForm.tsx
"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { LearningPath } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, BadgePercent } from "lucide-react"; // آیکون جدید
import { cn } from "@/lib/utils";

/**
 * استفاده از z.preprocess برای تبدیل رشته خالی به null
 * خروجی نهایی اسکیمای زیر از نظر TypeScript برابر خواهد بود با: { discountPrice: number | null }
 */
const formSchema = z.object({
  discountPrice: z.preprocess((val) => {
    // وقتی input خالی ارسال می‌شه ("" یا undefined یا null) -> null
    if (val === "" || val === undefined || val === null) return null;
    // اگر رشته بود سعی کن به عدد تبدیل کنی
    if (typeof val === "string") {
      const n = Number(val);
      return Number.isNaN(n) ? val : n;
    }
    return val;
  }, z.number().min(0, { message: "قیمت نمی‌تواند منفی باشد" }).nullable()),
});

type FormValues = z.infer<typeof formSchema>;

interface DiscountPriceFormProps {
  initialData: LearningPath;
  learningPathId: string;
}

export const DiscountPriceForm = ({ initialData, learningPathId }: DiscountPriceFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  // صریحاً resolver را به نوع مورد انتظار cast می‌کنیم
const resolverTyped = zodResolver(formSchema) as Resolver<FormValues, unknown>;

  const form = useForm<FormValues>({
    resolver: resolverTyped,
    defaultValues: {
      discountPrice: initialData?.discountPrice ?? null,
    },
  });

const { formState: { isSubmitting, isValid, errors } } = form;

  const discountIsInvalid =
    form.watch("discountPrice") !== null &&
    initialData.price !== null &&
    (form.watch("discountPrice")! >= initialData.price!);

  const toggleEdit = () => setIsEditing((current) => !current);

  const onSubmit = async (values: FormValues) => {
    if (discountIsInvalid) {
      toast.error("قیمت تخفیف خورده باید کمتر از قیمت اصلی باشد.");
      return;
    }

    try {
      await axios.patch(`/api/learning-paths/${learningPathId}`, { discountPrice: values.discountPrice });
      toast.success("قیمت تخفیف با موفقیت به‌روزرسانی شد.");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("مشکلی در ذخیره قیمت پیش آمد.");
    }
  };

  const calculateDiscountPercent = () => {
    if (initialData.price && initialData.discountPrice && initialData.price > initialData.discountPrice) {
      const discount = ((initialData.price - initialData.discountPrice) / initialData.price) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  const discountPercent = calculateDiscountPercent();

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        <div className="flex items-center gap-x-2">
            <BadgePercent className="h-5 w-5 text-[#00a7f5]" />
            قیمت پس از تخفیف (اختیاری)
        </div>
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? "انصراف" : <><Pencil className="h-4 w-4 ml-2" /> ویرایش</>}
        </Button>
      </div>
      {!isEditing && (
        <div className={cn(
            "text-sm mt-2",
            !initialData.discountPrice && "text-slate-500 italic"
        )}>
          {initialData.discountPrice ? (
            <div className="flex items-center gap-x-2">
                <span className="font-bold text-lg">{initialData.discountPrice.toLocaleString("fa-IR")} تومان</span>
                {discountPercent > 0 && (
                    <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md">
                        {discountPercent}% تخفیف
                    </span>
                )}
            </div>
          ) : (
            "تخفیفی ثبت نشده است."
          )}
        </div>
      )}
      {isEditing && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <Input
            type="number"
            step="1000"
            min="0"
            disabled={isSubmitting || initialData.price === null}
            placeholder="مثال: 99000 (برای حذف تخفیف، خالی بگذارید)"
            {...form.register("discountPrice")}
          />
          {initialData.price === null && (
            <p className="text-xs text-amber-600">ابتدا باید قیمت اصلی دوره را مشخص کنید.</p>
          )}
          {discountIsInvalid && (
              <p className="text-xs text-red-600">قیمت تخفیف خورده باید کمتر از قیمت اصلی ({initialData.price?.toLocaleString("fa-IR")} تومان) باشد.</p>
          )}
          {errors.discountPrice && (
              <p className="text-xs text-red-600">{errors.discountPrice.message}</p>
          )}
          <div className="flex items-center gap-x-2">
            <Button disabled={isSubmitting || !isValid || discountIsInvalid} type="submit">
              ذخیره
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
