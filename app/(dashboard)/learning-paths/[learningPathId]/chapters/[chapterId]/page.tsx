// فایل: app/(dashboard)/learning-paths/[learningPathId]/chapters/[chapterId]/page.tsx

import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// وارد کردن تمام کامپوننت‌های فرم مربوط به فصل
import { ChapterTitleForm } from "./_components/ChapterTitleForm";
import { ChapterDescriptionForm } from "./_components/ChapterDescriptionForm";
import { ChapterVideoForm } from "./_components/ChapterVideoForm";
import { ChapterActions } from "./_components/ChapterActions"; // کامپوننت عملیات مربوط به این فصل

export default async function ChapterIdPage({
  params,
}: {
  params: Promise<{ learningPathId: string; chapterId: string }>;
}) {
  const { learningPathId, chapterId } = await params;

  // دریافت اطلاعات کامل این فصل خاص
  const chapter = await db.chapter.findUnique({
    where: {
      id: chapterId,
      learningPathId: learningPathId,
    },
  });

  if (!chapter) {
    return redirect("/");
  }

  const requiredFields = [
    chapter.title,
    chapter.description,
    chapter.videoUrl,
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="w-full">
          <Link
            href={`/learning-paths/${learningPathId}/edit`}
            className="flex items-center text-sm text-slate-600 hover:text-slate-800 transition mb-6"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            بازگشت به تنظیمات مسیر یادگیری
          </Link>
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-y-2">
              <h1 className="text-2xl font-medium">ویرایش فصل</h1>
              <span className="text-sm text-slate-700">
                فیلدهای تکمیل شده {completionText}
              </span>
            </div>
            {/* استفاده از کامپوننت دکمه‌های انتشار و حذف فصل */}
            <ChapterActions
              initialData={chapter}
              learningPathId={learningPathId}
              chapterId={chapterId}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
        {/* ستون اول */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-x-2 mb-4">
              <h2 className="text-xl">سفارشی‌سازی فصل</h2>
            </div>
            <ChapterTitleForm
              initialData={chapter}
              learningPathId={learningPathId}
              chapterId={chapterId}
            />
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