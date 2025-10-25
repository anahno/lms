// فایل: app/(dashboard)/learning-paths/[learningPathId]/edit/_components/DescriptionForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pencil, FileText } from "lucide-react"; // آیکون جدید

const formSchema = z.object({
  description: z.string().min(1, { message: "توضیحات نمی‌تواند خالی باشد" }),
});

interface DescriptionFormProps {
  initialData: {
    description: string | null;
  };
  learningPathId: string;
}

export const DescriptionForm = ({ initialData, learningPathId }: DescriptionFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData.description || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const toggleEdit = () => setIsEditing((current) => !current);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/learning-paths/${learningPathId}`, values);
      toast.success("توضیحات با موفقیت به‌روزرسانی شد.");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("مشکلی پیش آمد.");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <FileText className="h-5 w-5 text-[#00a7f5]" />
          توضیحات مسیر یادگیری
        </div>
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? (
            <>انصراف</>
          ) : (
            <>
              <Pencil className="h-4 w-4 ml-2" />
              ویرایش
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <p className="text-sm mt-2">
          {initialData.description || "توضیحاتی ثبت نشده است."}
        </p>
      )}
      {isEditing && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <Textarea
            disabled={isSubmitting}
            placeholder="مثال: در این دوره، تمام مفاهیم پیشرفته..."
            {...form.register("description")}
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