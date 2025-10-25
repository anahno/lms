
// فایل: .../edit/_components/CategoryForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil, Layers } from "lucide-react"; // آیکون جدید
import { Combobox } from "@/components/ui/combobox";
import { Category } from "@prisma/client"; // تایپ Category را وارد می‌کنیم

const formSchema = z.object({
  categoryId: z.string().min(1),
});

interface CategoryFormProps {
  initialData: {
    categoryId: string | null;
  };
  learningPathId: string;
  // تایپ options را به ساختار جدید تغییر می‌دهیم
  options: (Category & { subcategories: Category[] })[];
}

export const CategoryForm = ({ initialData, learningPathId, options = [] }: CategoryFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: initialData.categoryId || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;
  const toggleEdit = () => setIsEditing((current) => !current);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/learning-paths/${learningPathId}`, values);
      toast.success("دسته‌بندی به‌روزرسانی شد.");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("مشکلی پیش آمد.");
    }
  };
  
  // منطق جدید برای پیدا کردن گزینه انتخاب شده در بین تمام زیرمجموعه‌ها
  const selectedOption = options
    .flatMap((group) => group.subcategories)
    .find((option) => option.id === initialData.categoryId);

  // تبدیل داده‌های دریافتی به فرمتی که کامپوننت Combobox انتظار دارد
  const formattedOptions = options.map(group => ({
      label: group.name,
      options: group.subcategories.map(sub => ({
          label: sub.name,
          value: sub.id,
      }))
  }));

    return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        <div className="flex items-center gap-x-2">
            <Layers className="h-5 w-5 text-[#00a7f5]" />
            دسته‌بندی مسیر یادگیری
        </div>
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? "انصراف" : <><Pencil className="h-4 w-4 ml-2" /> ویرایش</>}
        </Button>
      </div>
      {!isEditing && (
        <p className="text-sm mt-2">{selectedOption?.name || "انتخاب نشده"}</p>
      )}
      {isEditing && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <Combobox
            options={formattedOptions}
            {...form.register("categoryId")}
            onChange={(value) => form.setValue("categoryId", value, { shouldValidate: true })}
            value={form.watch("categoryId")}
          />
          <div className="flex items-center gap-x-2">
            <Button disabled={isSubmitting || !isValid} type="submit">ذخیره</Button>
          </div>
        </form>
      )}
    </div>
  );
};