// فایل: app/(dashboard)/learning-paths/[learningPathId]/chapters/[chapterId]/sections/[sectionId]/page.tsx
"use server";

import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// این کامپوننت‌ها را در قدم‌های بعدی خواهیم ساخت
import { SectionTitleForm } from "./_components/SectionTitleForm";
import { SectionDescriptionForm } from "./_components/SectionDescriptionForm";
import { SectionVideoForm } from "./_components/SectionVideoForm";
import { SectionActions } from "./_components/SectionActions";

export default async function SectionIdPage({
  params,
}: {
  params: { learningPathId: string; chapterId: string; sectionId: string };
}) {
  const { learningPathId, chapterId, sectionId } = params;

  // دریافت اطلاعات کامل این بخش خاص
  const section = await db.section.findUnique({
    where: {
      id: sectionId,
      chapterId: chapterId,
    },
  });

  if (!section) {
    return redirect(`/learning-paths/${learningPathId}/edit`);
  }
  
  // منطق تکمیل بودن "بخش"
  const requiredFields = [
    section.title,
    section.description,
    section.videoUrl,
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const isComplete = requiredFields.every(Boolean);
  const completionText = `(${completedFields}/${totalFields})`;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="w-full">
          {/* لینک بازگشت به صفحه مدیریت فصل */}
          <Link
            href={`/learning-paths/${learningPathId}/chapters/${chapterId}`}
            className="flex items-center text-sm text-slate-600 hover:text-slate-800 transition mb-6"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            بازگشت به تنظیمات فصل
          </Link>
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-y-2">
              <h1 className="text-2xl font-medium">ویرایش بخش</h1>
              <span className="text-sm text-slate-700">
                فیلدهای تکمیل شده {completionText}
              </span>
            </div>
            {/* کامپوننت دکمه‌های انتشار و حذف بخش */}
            <SectionActions
              learningPathId={learningPathId}
              chapterId={chapterId}
              sectionId={sectionId}
              isPublished={section.isPublished}
              isComplete={isComplete}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
        {/* ستون اول */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-x-2 mb-4">
              <h2 className="text-xl">سفارشی‌سازی بخش</h2>
            </div>
            <SectionTitleForm
              initialData={section}
              learningPathId={learningPathId}
              chapterId={chapterId}
              sectionId={sectionId}
            />
            <SectionDescriptionForm
              initialData={section}
              learningPathId={learningPathId}
              chapterId={chapterId}
              sectionId={sectionId}
            />
          </div>
        </div>
        {/* ستون دوم */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-x-2 mb-4">
              <h2 className="text-xl">ویدیوی بخش</h2>
            </div>
            <SectionVideoForm
              initialData={section}
              learningPathId={learningPathId}
              chapterId={chapterId}
              sectionId={sectionId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}