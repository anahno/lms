// فایل: .../chapters/[chapterId]/_components/ChapterTitleForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Chapter } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1),
});

interface ChapterTitleFormProps {
  initialData: Chapter;
  learningPathId: string;
  chapterId: string;
}

export const ChapterTitleForm = ({
  initialData,
  learningPathId,
  chapterId,
}: ChapterTitleFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: initialData.title },
  });

  const { isSubmitting, isValid } = form.formState;
  const toggleEdit = () => setIsEditing((current) => !current);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // ارسال درخواست به API جدید
      await axios.patch(`/api/learning-paths/${learningPathId}/chapters/${chapterId}`, values);
      toast.success("عنوان فصل به‌روزرسانی شد.");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("مشکلی پیش آمد.");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        عنوان فصل
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? "انصراف" : <><Pencil className="h-4 w-4 ml-2" /> ویرایش</>}
        </Button>
      </div>
      {!isEditing && <p className="text-sm mt-2">{initialData.title}</p>}
      {isEditing && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <Input
            disabled={isSubmitting}
            placeholder="مثال: مقدمه‌ای بر ..."
            {...form.register("title")}
          />
          <div className="flex items-center gap-x-2">
            <Button disabled={isSubmitting || !isValid} type="submit">ذخیره</Button>
          </div>
        </form>
      )}
    </div>
  );
};