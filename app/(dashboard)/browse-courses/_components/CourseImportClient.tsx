// فایل: app/(dashboard)/browse-courses/_components/CourseImportClient.tsx
"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { importCourseFromJson } from "@/actions/export-import-actions";

export const CourseImportClient = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, startTransition] = useTransition();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        toast.error("فایل خالی است یا قابل خواندن نیست.");
        return;
      }
      
      startTransition(async () => {
        toast.loading("در حال وارد کردن دوره...");
        const result = await importCourseFromJson(content);
        toast.dismiss();

        // ========== اصلاح اصلی برای رفع خطای TypeScript ==========
        if ("success" in result) {
          toast.success("دوره با موفقیت به صورت پیش‌نویس وارد شد!");
          router.refresh();
          // حالا تایپ‌اسکریپت می‌داند که result.courseId حتما وجود دارد
          router.push(`/learning-paths/${result.courseId}/edit`);
        } else {
          // اگر success وجود نداشت، پس حتما error وجود دارد
          toast.error(result.error);
        }
        // =======================================================
      });
    };
    reader.readAsText(file);
    
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".json"
      />
      <Button onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
        <Upload className="w-4 h-4 ml-2" />
        {isImporting ? "در حال پردازش..." : "وارد کردن دوره از فایل JSON"}
      </Button>
    </>
  );
};