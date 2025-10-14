// فایل: .../sections/[sectionId]/_components/SectionDescriptionForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Section } from "@prisma/client";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "@/components/tiptap/TiptapEditor";

const formSchema = z.object({
  description: z.string().min(1, { message: "توضیحات الزامی است" }),
});

interface SectionDescriptionFormProps {
  initialData: Section;
  learningPathId: string;
  chapterId: string;
  sectionId: string;
}

export const SectionDescriptionForm = ({
  initialData,
  learningPathId,
  chapterId,
  sectionId,
}: SectionDescriptionFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { description: initialData.description || "" },
  });

  const { isSubmitting, isValid } = form.formState;
  const toggleEdit = () => setIsEditing((current) => !current);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}`, values);
      toast.success("توضیحات بخش به‌روزرسانی شد.");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("مشکلی پیش آمد.");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        توضیحات بخش
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? "انصراف" : <><Pencil className="h-4 w-4 ml-2" /> ویرایش</>}
        </Button>
      </div>
      {!isEditing && (
        <div
          className="text-sm mt-2 prose max-w-full"
          dangerouslySetInnerHTML={{ __html: initialData.description || "<i>توضیحاتی ثبت نشده است.</i>" }}
        />
      )}
      {isEditing && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <TiptapEditor
            value={form.watch("description")}
            onChange={(value) => form.setValue("description", value, { shouldValidate: true })}
          />
          <div className="flex items-center gap-x-2">
            <Button disabled={isSubmitting || !isValid} type="submit">ذخیره</Button>
          </div>
        </form>
      )}
    </div>
  );
};