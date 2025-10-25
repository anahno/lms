// فایل: app/(dashboard)/learning-paths/[learningPathId]/edit/_components/ImageForm.tsx
"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pencil, PlusCircle, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // ما به کامپوننت Input نیاز داریم

interface ImageFormProps {
  initialData: {
    imageUrl: string | null;
  };
  learningPathId: string;
}

export const ImageForm = ({ initialData, learningPathId }: ImageFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const toggleEdit = () => setIsEditing((current) => !current);

  // این تابع مسئول آپلود فایل است
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // ۱. دریافت فایل از input
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    // ۲. ساخت یک FormData برای ارسال فایل
    const formData = new FormData();
    formData.append("file", file);

    try {
      // ۳. ارسال فایل به API سفارشی آپلود
      const uploadResponse = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // ۴. پس از آپلود موفق، URL تصویر را در دیتابیس ذخیره کن
      await axios.patch(`/api/learning-paths/${learningPathId}`, {
        imageUrl: uploadResponse.data.url,
      });

      toast.success("تصویر با موفقیت آپلود شد.");
      toggleEdit(); // بستن حالت ویرایش
      router.refresh(); // رفرش کردن داده‌های صفحه
    } catch {
      toast.error("آپلود با خطا مواجه شد. لطفاً دوباره امتحان کنید.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        <div className="flex items-center gap-x-2">
            <ImageIcon className="h-5 w-5 text-[#00a7f5]" />
            تصویر مسیر یادگیری
        </div>
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing && <>انصراف</>}
          {!isEditing && !initialData.imageUrl && (
            <>
              <PlusCircle className="h-4 w-4 ml-2" />
              افزودن تصویر
            </>
          )}
          {!isEditing && initialData.imageUrl && (
            <>
              <Pencil className="h-4 w-4 ml-2" />
              تغییر تصویر
            </>
          )}
        </Button>
      </div>
      {!isEditing &&
        (!initialData.imageUrl ? (
          <div className="flex items-center justify-center h-60 bg-slate-200 rounded-md">
            <ImageIcon className="h-10 w-10 text-slate-500" />
          </div>
        ) : (
          <div className="relative aspect-video mt-2">
            <Image
              alt="تصویر مسیر یادگیری"
              fill
              className="object-cover rounded-md"
              src={initialData.imageUrl}
            />
          </div>
        ))}
      {isEditing && (
        <div className="mt-2">
          {/* استفاده از یک Input ساده برای انتخاب فایل */}
          <Input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="file:text-sm file:font-medium file:text-stone-700"
          />
          <div className="text-xs text-muted-foreground mt-2">
            {uploading ? "در حال آپلود، لطفاً صبر کنید..." : "یک تصویر با نسبت ۱۶:۹ انتخاب کنید."}
          </div>
        </div>
      )}
    </div>
  );
};