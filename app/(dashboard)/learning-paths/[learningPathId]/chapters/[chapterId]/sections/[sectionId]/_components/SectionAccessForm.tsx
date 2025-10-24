// فایل: app/(dashboard)/learning-paths/[learningPathId]/chapters/[chapterId]/sections/[sectionId]/_components/SectionAccessForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Section } from "@prisma/client";
import { Lock, LockOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// +++ شروع تغییر ۱: ساده‌سازی schema +++
// .default(false) از اینجا حذف شد
const formSchema = z.object({
  isFree: z.boolean(),
});
// +++ پایان تغییر ۱ +++

interface SectionAccessFormProps {
  initialData: Section;
  learningPathId: string;
  chapterId: string;
  sectionId: string;
}

export const SectionAccessForm = ({
  initialData,
  learningPathId,
  chapterId,
  sectionId,
}: SectionAccessFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isFree: !!initialData.isFree, // این خط به درستی مقدار اولیه را به boolean تبدیل می‌کند
    },
  });

  // +++ شروع تغییر ۲: حذف متغیر استفاده نشده isValid +++
  const { isSubmitting } = form.formState;
  // +++ پایان تغییر ۲ +++
  const toggleEdit = () => setIsEditing((current) => !current);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}`, values);
      toast.success("تنظیمات دسترسی به‌روزرسانی شد.");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("مشکلی پیش آمد.");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        تنظیمات دسترسی
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? "انصراف" : "ویرایش"}
        </Button>
      </div>
      {!isEditing && (
        <div className={`text-sm mt-2 flex items-center gap-x-2 ${!initialData.isFree ? "text-amber-600" : "text-emerald-600"}`}>
          {initialData.isFree ? (
            <>
              <LockOpen className="h-4 w-4" />
              این بخش به عنوان پیش‌نمایش رایگان در دسترس است.
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              این بخش نیاز به خرید دوره دارد.
            </>
          )}
        </div>
      )}
      {isEditing && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id="isFree"
              checked={form.watch("isFree")}
              onCheckedChange={(checked) => form.setValue("isFree", !!checked)}
            />
            <Label htmlFor="isFree" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              این بخش را به عنوان پیش‌نمایش رایگان علامت بزن
            </Label>
          </div>
          <div className="flex items-center gap-x-2">
            <Button disabled={isSubmitting} type="submit">ذخیره</Button>
          </div>
        </form>
      )}
    </div>
  );
};