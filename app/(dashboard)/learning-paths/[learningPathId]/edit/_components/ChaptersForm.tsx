// فایل: app/(dashboard)/learning-paths/[learningPathId]/edit/_components/ChaptersForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Chapter } from "@prisma/client";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Grip } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// شمای اعتبارسنجی برای فرم ایجاد فصل جدید
const formSchema = z.object({
  title: z.string().min(1, { message: "عنوان الزامی است" }),
});

// تعریف Props برای کامپوننت
interface ChaptersFormProps {
  initialData: {
    chapters: Chapter[];
  };
  learningPathId: string;
}

export const ChaptersForm = ({ initialData, learningPathId }: ChaptersFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  // تنظیمات فرم با React Hook Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "" },
  });

  const { isSubmitting, isValid } = form.formState;

  // تابع برای باز و بسته کردن حالت ایجاد فصل
  const toggleCreating = () => setIsCreating((current) => !current);

  // تابع برای ارسال اطلاعات فرم به API
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post(`/api/learning-paths/${learningPathId}/chapters`, values);
      toast.success("فصل جدید با موفقیت ایجاد شد.");
      toggleCreating();
      form.reset();
      router.refresh();
    } catch {
      toast.error("مشکلی در ایجاد فصل پیش آمد.");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        فصل‌های مسیر یادگیری
        <Button onClick={toggleCreating} variant="ghost">
          {isCreating ? (
            <>انصراف</>
          ) : (
            <>
              <PlusCircle className="h-4 w-4 ml-2" />
              افزودن فصل
            </>
          )}
        </Button>
      </div>
      
      {/* فرم ایجاد فصل جدید (فقط در حالت isCreating نمایش داده می‌شود) */}
      {isCreating && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <Input
            disabled={isSubmitting}
            placeholder="مثال: مقدمه‌ای بر طراحی ..."
            {...form.register("title")}
          />
          <Button disabled={isSubmitting || !isValid} type="submit">
            ایجاد
          </Button>
        </form>
      )}

      {/* نمایش لیست فصل‌های موجود (فقط وقتی در حال ایجاد فصل جدید نیستیم) */}
      {!isCreating && (
        <>
          {initialData.chapters.length === 0 && (
            <p className="text-sm text-slate-500 italic mt-2">
              هنوز فصلی برای این مسیر یادگیری اضافه نشده است.
            </p>
          )}
          <div className="space-y-2 mt-4">
            {initialData.chapters.map((chapter) => (
              <Link
                href={`/learning-paths/${learningPathId}/chapters/${chapter.id}`}
                key={chapter.id}
              >
                <div
                  className="flex items-center gap-x-2 bg-slate-200 border-slate-300 border text-slate-700 rounded-md p-3 hover:bg-slate-300 transition"
                >
                  <Grip className="h-5 w-5 text-slate-500" />
                  <p className="flex-1 font-medium">{chapter.title}</p>
                  <Badge className={!chapter.isPublished ? "bg-slate-500" : "bg-sky-700"}>
                    {chapter.isPublished ? "منتشر شده" : "پیش‌نویس"}
                  </Badge>
                  <Pencil className="h-4 w-4 hover:text-sky-700 transition" />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};