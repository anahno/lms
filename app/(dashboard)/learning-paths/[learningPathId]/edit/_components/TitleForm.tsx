// فایل: app/(dashboard)/learning-paths/[learningPathId]/edit/_components/TitleForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Pencil, Copy, Check, TextCursorInput } from "lucide-react"; // <-- آیکون جدید

// --- این بخش بدون تغییر باقی می‌ماند ---
function generateSlug(title: string): string {
  if (!title) return ""; 

  const allowedChars = "a-zA-Z0-9\u0600-\u06FF\\+";
  
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(new RegExp(`[^${allowedChars}\\-]+`, 'g'), '')
    .replace(/--+/g, '-');

  if (slug !== '-' && slug.replace(/-/g, '').length > 0) {
    return slug.replace(/^-+|-+$/g, '');
  }
  
  return slug;
}

const formSchema = z.object({
  title: z.string().min(1, { message: "عنوان نمی‌تواند خالی باشد" }),
  slug: z.string().min(3, "پیوند یکتا باید حداقل ۳ کاراکتر باشد.")
    .regex(/^[a-z0-9\u0600-\u06FF+-]+(-[a-z0-9\u0600-\u06FF+-]+)*$/, "فرمت پیوند یکتا نامعتبر است. فقط از حروف، اعداد و خط تیره استفاده کنید."),
});

interface TitleFormProps {
  initialData: {
    title: string;
    slug: string;
  };
  learningPathId: string;
}

export const TitleForm = ({ initialData, learningPathId }: TitleFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title,
      slug: initialData.slug,
    },
    mode: "onChange"
  });

  // +++ شروع اصلاح کلیدی +++
  const { formState: { isSubmitting, isValid }, watch, setValue } = form;
  // +++ پایان اصلاح کلیدی +++

  const watchedTitle = watch("title");

  useEffect(() => {
    if (isEditing && !isSlugManuallyEdited) {
      const suggestedSlug = generateSlug(watchedTitle);
      setValue("slug", suggestedSlug, { shouldValidate: true });
    }
  }, [watchedTitle, isEditing, isSlugManuallyEdited, setValue]);


  const toggleEdit = () => {
    setIsEditing((current) => !current);
    setIsSlugManuallyEdited(false);
    form.reset({ title: initialData.title, slug: initialData.slug });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/learning-paths/${learningPathId}`, values);
      toast.success("عنوان و پیوند یکتا با موفقیت به‌روزرسانی شد.");
      toggleEdit();
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error(error.response.data);
      } else {
        toast.error("مشکلی در ذخیره‌سازی پیش آمد.");
      }
    }
  };

  const handleCopy = () => {
    const fullUrl = `${process.env.NEXT_PUBLIC_APP_URL}/courses/${initialData.slug}`;
    navigator.clipboard.writeText(fullUrl);
    setIsCopied(true);
    toast.success("پیوند یکتا کپی شد!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4 space-y-4">
      <div className="font-medium flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <TextCursorInput className="h-5 w-5 text-[#00a7f5]" />
          عنوان و پیوند یکتا
        </div>
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? "انصراف" : <><Pencil className="h-4 w-4 ml-2" /> ویرایش</>}
        </Button>
      </div>

      {!isEditing ? (
        <div className="space-y-4 pt-2">
            <p className="text-sm"><strong>عنوان:</strong> {initialData.title}</p>
            <div className="space-y-2">
                <Label htmlFor="permalink-display">پیوند یکتا (URL)</Label>
                <div className="flex items-center gap-x-2">
                    <Input id="permalink-display" readOnly value={`${process.env.NEXT_PUBLIC_APP_URL}/courses/${initialData.slug}`} className="bg-slate-200 text-slate-700 text-sm"/>
                    <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
                        {isCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان مسیر یادگیری</Label>
            <Input id="title" disabled={isSubmitting} {...form.register("title")} />
            {form.formState.errors.title && <p className="text-red-500 text-xs mt-1">{form.formState.errors.title.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="slug">پیوند یکتا (Slug)</Label>
            <Input 
                id="slug" 
                disabled={isSubmitting} 
                {...form.register("slug")}
                onChange={(e) => {
                    setIsSlugManuallyEdited(true);
                    const cleanedValue = generateSlug(e.target.value);
                    form.setValue("slug", cleanedValue, { shouldValidate: true });
                }}
            />
            {form.formState.errors.slug && <p className="text-red-500 text-xs mt-1">{form.formState.errors.slug.message}</p>}
            <p className="text-xs text-muted-foreground">این بخش به صورت خودکار بر اساس عنوان تولید می‌شود، اما می‌توانید آن را ویرایش کنید.</p>
          </div>
          
          <div className="flex items-center gap-x-2">
            <Button disabled={isSubmitting || !isValid} type="submit">ذخیره</Button>
          </div>
        </form>
      )}
    </div>
  );
};