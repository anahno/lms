"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { User } from "@prisma/client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UploadCloud } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, { message: "نام الزامی است." }),
  bio: z.string().optional(),
});

interface ProfileFormProps {
  initialData: User;
  isInstructor: boolean;
}

export const ProfileForm = ({ initialData, isInstructor }: ProfileFormProps) => {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData.name || "",
      bio: initialData.bio || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadResponse = await axios.post("/api/upload", formData);
      // بلافاصله پس از آپلود، تصویر پروفایل را آپدیت می‌کنیم
      await axios.patch("/api/account/profile", { image: uploadResponse.data.url });
      toast.success("تصویر پروفایل با موفقیت آپلود شد.");
      router.refresh();
    } catch {
      toast.error("آپلود تصویر با خطا مواجه شد.");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch("/api/account/password", values);
      toast.success("رمز عبور با موفقیت تغییر یافت.");
      form.reset();
    } catch (error) { // <-- تغییر در اینجا: 'any' حذف شد
      // --- شروع تغییر ---
      if (axios.isAxiosError(error)) {
        // اگر خطا از سمت سرور باشد، پیام سرور را نمایش بده
        toast.error(error.response?.data || "مشکلی در تغییر رمز عبور پیش آمد.");
      } else {
        // برای خطاهای دیگر
        toast.error("یک خطای ناشناخته رخ داد.");
      }
      // --- پایان تغییر ---
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>اطلاعات پروفایل</CardTitle>
        <CardDescription>نام، بیوگرافی و تصویر خود را مدیریت کنید.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center gap-x-6">
            <Image
              src={initialData.image || "/images/default-avatar.png"}
              alt={initialData.name || ""}
              width={100}
              height={100}
              className="rounded-full object-cover"
            />
            <div>
              <Label htmlFor="picture" className="block mb-2">تغییر تصویر پروفایل</Label>
              <Button asChild variant="outline" disabled={isUploading}>
                <label htmlFor="picture" className="cursor-pointer">
                  <UploadCloud className="w-4 h-4 ml-2" />
                  {isUploading ? "در حال آپلود..." : "انتخاب فایل"}
                  <input id="picture" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">نام</Label>
            <Input id="name" {...form.register("name")} disabled={isSubmitting} />
            {form.formState.errors.name && <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>}
          </div>
          
          {isInstructor && (
            <div className="space-y-2">
              <Label htmlFor="bio">بیوگرافی (مخصوص اساتید)</Label>
              <Textarea id="bio" {...form.register("bio")} disabled={isSubmitting} placeholder="درباره خودتان و تخصصتان بنویسید..." rows={5} />
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};