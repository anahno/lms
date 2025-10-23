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
import { Pencil } from "lucide-react";

// ✅ اسکیمای دقیق و بدون ambiguous type
const formSchema = z.object({
  price: z.preprocess((val) => {
    if (val === "" || val === undefined || val === null) return null;
    if (typeof val === "string") {
      const n = Number(val);
      return Number.isNaN(n) ? val : n;
    }
    return val;
  }, z.number().min(0, { message: "قیمت نمی‌تواند منفی باشد" }).nullable()),
});

type FormValues = z.infer<typeof formSchema>;

interface PriceFormProps {
  initialData: LearningPath;
  learningPathId: string;
}

export const PriceForm = ({ initialData, learningPathId }: PriceFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  // ✅ حل ارور با cast تایپ امن به unknown
  const resolverTyped = zodResolver(formSchema) as Resolver<FormValues, unknown>;

  const form = useForm<FormValues>({
    resolver: resolverTyped,
    defaultValues: {
      price: initialData?.price ?? null,
    },
  });

  // ✅ ساختار درست دسترسی به state‌ها
  const { formState: { isSubmitting, isValid } } = form;

  const toggleEdit = () => setIsEditing((current) => !current);

  const onSubmit = async (values: FormValues) => {
    try {
      await axios.patch(`/api/learning-paths/${learningPathId}`, values);
      toast.success("قیمت دوره با موفقیت به‌روزرسانی شد.");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("مشکلی در ذخیره قیمت پیش آمد.");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        قیمت دوره (به تومان)
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? "انصراف" : (
            <>
              <Pencil className="h-4 w-4 ml-2" /> ویرایش
            </>
          )}
        </Button>
      </div>

      {!isEditing && (
        <p className="text-sm mt-2">
          {initialData.price !== null
            ? initialData.price > 0
              ? `${initialData.price.toLocaleString("fa-IR")} تومان`
              : "رایگان"
            : "قیمتی ثبت نشده است."}
        </p>
      )}

      {isEditing && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <Input
            type="number"
            step="1000"
            min="0"
            disabled={isSubmitting}
            placeholder="مثال: 150000 (برای رایگان، خالی بگذارید یا 0 وارد کنید)"
            {...form.register("price")}
          />
          <div className="flex items-center gap-x-2">
            <Button disabled={isSubmitting || !isValid} type="submit">
              ذخیره
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
