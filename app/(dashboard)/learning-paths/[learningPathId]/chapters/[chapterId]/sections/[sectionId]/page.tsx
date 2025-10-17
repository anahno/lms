// فایل: app/(dashboard)/learning-paths/[learningPathId]/chapters/[chapterId]/sections/[sectionId]/page.tsx
"use server";

import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SectionTitleForm } from "./_components/SectionTitleForm";
import { SectionDescriptionForm } from "./_components/SectionDescriptionForm";
import { SectionVideoForm } from "./_components/SectionVideoForm";
import { SectionActions } from "./_components/SectionActions";
// --- ۱. کامپوننت جدید را وارد کنید ---
import { SectionAudioForm } from "./_components/SectionAudioForm";

export default async function SectionIdPage({
  params,
}: {
  params: Promise<{ learningPathId: string; chapterId: string; sectionId: string }>;
}) {
  const { learningPathId, chapterId, sectionId } = await params;

  const section = await db.section.findUnique({
    where: {
      id: sectionId,
      chapterId: chapterId,
    },
  });

  if (!section) {
    return redirect(`/learning-paths/${learningPathId}/edit`);
  }
  
  // --- ۲. شروع تغییر منطق تکمیل بودن بخش ---
  // بررسی می‌کنیم که حداقل یک محتوا (ویدیو یا صوت) وجود داشته باشد
  const hasContent = !!section.videoUrl || !!section.audioUrl;

  const requiredFields = [
    section.title,
    section.description,
    hasContent, // از نتیجه بررسی بالا استفاده می‌کنیم
  ];
  // --- پایان تغییر منطق ---

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const isComplete = requiredFields.every(Boolean);
  const completionText = `(${completedFields}/${totalFields})`;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="w-full">
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
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-x-2 mb-4">
              <h2 className="text-xl">محتوای بخش</h2>
            </div>
            <SectionVideoForm
              initialData={section}
              learningPathId={learningPathId}
              chapterId={chapterId}
              sectionId={sectionId}
            />
            {/* --- ۳. کامپوننت فرم صوت را اینجا اضافه کنید --- */}
            <SectionAudioForm
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