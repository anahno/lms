// فایل: app/(dashboard)/learning-paths/[learningPathId]/chapters/[chapterId]/sections/[sectionId]/quiz/page.tsx
"use server";

import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
// ما برای این صفحه هم کامپوننت‌های فرم جداگانه خواهیم ساخت
// import { QuizTitleForm } from "./_components/QuizTitleForm";
// import { QuizQuestionsForm } from "./_components/QuizQuestionsForm";
import { QuizQuestionsForm } from "./_components/QuizQuestionsForm";

export default async function QuizManagementPage({
  params,
}: {
  params: Promise<{
    learningPathId: string;
    chapterId: string;
    sectionId: string;
  }>;
}) {
  const { learningPathId, chapterId, sectionId } = await params;

  // واکشی آزمون به همراه سوالات و گزینه‌هایشان
  const quiz = await db.quiz.findUnique({
    where: {
      sectionId: sectionId,
    },
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: {
          options: true,
        },
      },
    },
  });

  // اگر آزمونی برای این بخش وجود نداشت، به صفحه ویرایش بخش برگرد
  if (!quiz) {
    return redirect(`/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}`);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="w-full">
          <Link
            href={`/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}`}
            className="flex items-center text-sm text-slate-600 hover:text-slate-800 transition mb-6"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            بازگشت به تنظیمات بخش
          </Link>
          <h1 className="text-2xl font-medium">مدیریت آزمون</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
        <div className="space-y-4">
          <h2 className="text-xl">تنظیمات کلی آزمون</h2>
          {/* کامپوننت فرم عنوان آزمون اینجا قرار خواهد گرفت */}
          <div className="p-4 bg-slate-100 rounded-md">
            <p className="font-bold">عنوان آزمون:</p>
            <p>{quiz.title}</p>
          </div>
        </div>
        <div className="space-y-4">
                      {/* --- ۲. کامپوننت واقعی را جایگزین placeholder کنید --- */}
          <QuizQuestionsForm
            initialData={quiz}
            learningPathId={learningPathId}
            chapterId={chapterId}
            sectionId={sectionId}
          />
        </div>
          </div>
        </div>

  );
}