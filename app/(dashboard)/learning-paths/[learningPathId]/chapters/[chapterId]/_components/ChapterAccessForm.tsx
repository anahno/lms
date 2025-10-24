// فایل: app/(dashboard)/learning-paths/[learningPathId]/chapters/[chapterId]/_components/ChapterAccessForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Chapter } from "@prisma/client";
import { Lock, LockOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  isFree: z.boolean(),
});

interface ChapterAccessFormProps {
  initialData: Chapter;
  learningPathId: string;
  chapterId: string;
}

export const ChapterAccessForm = ({
  initialData,
  learningPathId,
  chapterId,
}: ChapterAccessFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isFree: !!initialData.isFree,
    },
  });

  const { isSubmitting } = form.formState;
  const toggleEdit = () => setIsEditing((current) => !current);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/learning-paths/${learningPathId}/chapters/${chapterId}`, values);
      toast.success("تنظیمات دسترسی فصل به‌روزرسانی شد.");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("مشکلی پیش آمد.");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        تنظیمات دسترسی فصل
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? "انصراف" : "ویرایش"}
        </Button>
      </div>
      {!isEditing && (
        <div className={`text-sm mt-2 flex items-center gap-x-2 ${!initialData.isFree ? "text-amber-600" : "text-emerald-600"}`}>
          {initialData.isFree ? (
            <>
              <LockOpen className="h-4 w-4" />
              این فصل و تمام بخش‌های آن (به جز بخش‌های رایگان خاص) رایگان هستند.
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              این فصل نیاز به خرید دوره دارد.
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
            <Label htmlFor="isFree" className="text-sm font-medium leading-none">
              تمام بخش‌های این فصل را به عنوان پیش‌نمایش رایگان علامت بزن
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            با فعال کردن این گزینه، کاربرانی که ثبت‌نام نکرده‌اند می‌توانند تمام محتوای این فصل را مشاهده کنند.
          </p>
          <div className="flex items-center gap-x-2">
            <Button disabled={isSubmitting} type="submit">ذخیره</Button>
          </div>
        </form>
      )}
    </div>
  );
};