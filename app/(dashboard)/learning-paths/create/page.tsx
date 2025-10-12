// فایل: app/(dashboard)/learning-paths/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function CreateLearningPathPage() {
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ارسال درخواست به API با استفاده از axios
      const response = await axios.post("/api/learning-paths", { title });
      
      toast.success("مسیر یادگیری با موفقیت ایجاد شد!");
      
      // کاربر را به صفحه ویرایش این مسیر جدید هدایت کن
      // response.data حاوی آبجکتی است که API ما برگردانده (شامل id)
      router.push(`/learning-paths/${response.data.id}/edit`);

    } catch (error) {
      console.error("Failed to create learning path", error);
      toast.error("مشکلی در ایجاد مسیر یادگیری پیش آمد.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-start pt-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">نام مسیر یادگیری خود را انتخاب کنید</CardTitle>
          <CardDescription>
            نگران نباشید، شما همیشه می‌توانید این نام را بعداً تغییر دهید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان مسیر یادگیری</Label>
              <Input
                id="title"
                placeholder="مثال: آموزش پیشرفته Figma"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                required
              />
              <p className="text-sm text-muted-foreground">
                این عنوان در دوره شما نمایش داده خواهد شد.
              </p>
            </div>
            <div className="flex items-center gap-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()} // دکمه بازگشت
              >
                انصراف
              </Button>
              <Button type="submit" disabled={isLoading || !title}>
                {isLoading ? "در حال ایجاد..." : "ادامه"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}