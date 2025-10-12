// فایل: app/(dashboard)/learning-paths/[learningPathId]/chapters/[chapterId]/page.tsx

import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// وارد کردن تمام کامپوننت‌های مورد نیاز
import { ChapterTitleForm } from "./_components/ChapterTitleForm";
import { ChapterDescriptionForm } from "./_components/ChapterDescriptionForm";
import { ChapterVideoForm } from "./_components/ChapterVideoForm";
import { ChapterActions } from "./_components/ChapterActions";

export default async function ChapterIdPage({
  params,
}: {
  params: Promise<{ learningPathId: string; chapterId: string }>;
}) {
  const { learningPathId, chapterId } = await params;

  // دریافت اطلاعات کامل فصل از پایگاه داده
  const chapter = await db.chapter.findUnique({
    where: {
      id: chapterId,
      learningPathId: learningPathId,
    },
  });

  // اگر فصل پیدا نشد، کاربر را به صفحه اصلی هدایت می‌کنیم
  if (!chapter) {
    return redirect("/");
  }

  // لیستی از فیلدهای ضروری فصل برای نمایش پیشرفت
  const requiredFields = [
    chapter.title,
    chapter.description,
    chapter.videoUrl,
  ];

  // محاسبه تعداد فیلدهای تکمیل شده
  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;

  return (
    <div className="p-6">
      {/* بخش هدر صفحه */}
      <div className="flex items-center justify-between mb-6">
        <div className="w-full">
          {/* لینک بازگشت به صفحه قبلی */}
          <Link
            href={`/learning-paths/${learningPathId}/edit`}
            className="flex items-center text-sm text-slate-600 hover:text-slate-800 transition mb-6"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            بازگشت به تنظیمات مسیر یادگیری
          </Link>
          {/* عنوان صفحه و دکمه‌های عملیاتی */}
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-y-2">
              <h1 className="text-2xl font-medium">ویرایش فصل</h1>
              <span className="text-sm text-slate-700">
                فیلدهای تکمیل شده {completionText}
              </span>
            </div>
            {/* کامپوننت دکمه‌های انتشار و حذف */}
            <ChapterActions
              initialData={chapter}
              learningPathId={learningPathId}
              chapterId={chapterId}
            />
          </div>
        </div>
      </div>

      {/* بخش اصلی محتوا با چیدمان دو ستونی */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
        {/* ستون اول */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-x-2 mb-4">
              <h2 className="text-xl">سفارشی‌سازی فصل</h2>
            </div>
            {/* فرم ویرایش عنوان فصل */}
            <ChapterTitleForm
              initialData={chapter}
              learningPathId={learningPathId}
              chapterId={chapterId}
            />
            {/* فرم ویرایش توضیحات فصل */}
            <ChapterDescriptionForm
              initialData={chapter}
              learningPathId={learningPathId}
              chapterId={chapterId}
            />
          </div>
        </div>
        {/* ستون دوم */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-x-2 mb-4">
              <h2 className="text-xl">ویدیو</h2>
            </div>
            {/* فرم آپلود و نمایش ویدیوی فصل */}
            <ChapterVideoForm
              initialData={chapter}
              learningPathId={learningPathId}
              chapterId={chapterId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}