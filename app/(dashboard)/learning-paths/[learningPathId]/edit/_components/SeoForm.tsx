// فایل: app/(dashboard)/learning-paths/[learningPathId]/edit/_components/SeoForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { LearningPath } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pencil, Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  metaTitle: z.string().min(1, "عنوان متا الزامی است.").max(70, "عنوان متا باید کمتر از ۷۰ کاراکتر باشد."),
  metaDescription: z.string().min(1, "توضیحات متا الزامی است.").max(160, "توضیحات متا باید کمتر از ۱۶۰ کاراکتر باشد."),
  metaKeywords: z.string().optional(), // به صورت یک رشته با کاما جدا شده دریافت می‌شود
});

interface SeoFormProps {
  initialData: LearningPath;
  learningPathId: string;
}

export const SeoForm = ({ initialData, learningPathId }: SeoFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      metaTitle: initialData.metaTitle || initialData.title,
      metaDescription: initialData.metaDescription || initialData.subtitle || "",
      metaKeywords: initialData.metaKeywords.join(", "),
    },
  });

  const { isSubmitting, isValid } = form.formState;
  const toggleEdit = () => setIsEditing((current) => !current);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // تبدیل رشته کلمات کلیدی به آرایه
      const keywordsArray = values.metaKeywords ? values.metaKeywords.split(",").map(k => k.trim()).filter(Boolean) : [];
      await axios.patch(`/api/learning-paths/${learningPathId}`, {
        metaTitle: values.metaTitle,
        metaDescription: values.metaDescription,
        metaKeywords: keywordsArray,
      });
      toast.success("اطلاعات SEO به‌روزرسانی شد.");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("مشکلی پیش آمد.");
    }
  };

  // تابع هوشمند برای تولید پیشنهاد
  const generateSuggestions = () => {
    form.setValue("metaTitle", `آموزش جامع ${initialData.title}`, { shouldValidate: true });
    form.setValue("metaDescription", `در این دوره آموزشی، به صورت کامل و پروژه محور با ${initialData.title} آشنا خواهید شد. ${initialData.subtitle || ''}`.substring(0, 160), { shouldValidate: true });
    form.setValue("metaKeywords", `آموزش ${initialData.title}, دوره ${initialData.title}, ${initialData.title}, یادگیری ${initialData.title}`);
    toast.success("پیشنهادهای SEO تولید شد!");
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        تنظیمات SEO (بهینه‌سازی برای موتورهای جستجو)
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? "انصراف" : <><Pencil className="h-4 w-4 ml-2" /> ویرایش</>}
        </Button>
      </div>
      {!isEditing && (
        <div className="mt-2 space-y-3 text-sm text-slate-600">
            <p><strong>عنوان متا:</strong> {initialData.metaTitle || "تنظیم نشده"}</p>
            <p><strong>توضیحات متا:</strong> {initialData.metaDescription || "تنظیم نشده"}</p>
            <p><strong>کلمات کلیدی:</strong> {initialData.metaKeywords.join(', ') || "تنظیم نشده"}</p>
        </div>
      )}
      {isEditing && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="flex justify-start">
            <Button type="button" variant="outline" size="sm" onClick={generateSuggestions}>
                <Sparkles className="h-4 w-4 ml-2 text-yellow-500" />
                تولید هوشمند پیشنهاد
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaTitle">عنوان متا (Title Tag)</Label>
            <Input id="metaTitle" disabled={isSubmitting} {...form.register("metaTitle")} />
            <p className="text-xs text-muted-foreground mt-1">حدود ۶۰ کاراکتر - در عنوان تب مرورگر و نتایج گوگل نمایش داده می‌شود.</p>
             {form.formState.errors.metaTitle && <p className="text-red-500 text-xs mt-1">{form.formState.errors.metaTitle.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="metaDescription">توضیحات متا (Meta Description)</Label>
            <Textarea id="metaDescription" disabled={isSubmitting} {...form.register("metaDescription")} rows={4}/>
            <p className="text-xs text-muted-foreground mt-1">حدود ۱۶۰ کاراکتر - توضیحی که زیر عنوان در نتایج گوگل نمایش داده می‌شود.</p>
             {form.formState.errors.metaDescription && <p className="text-red-500 text-xs mt-1">{form.formState.errors.metaDescription.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="metaKeywords">کلمات کلیدی (Meta Keywords)</Label>
            <Input id="metaKeywords" disabled={isSubmitting} {...form.register("metaKeywords")} placeholder="مثال: آموزش نکست, دوره react, برنامه نویسی وب" />
            <p className="text-xs text-muted-foreground mt-1">کلمات کلیدی را با کاما (,) از هم جدا کنید.</p>
          </div>
          
          <div className="flex items-center gap-x-2">
            <Button disabled={isSubmitting || !isValid} type="submit">ذخیره</Button>
          </div>
        </form>
      )}
    </div>
  );
};