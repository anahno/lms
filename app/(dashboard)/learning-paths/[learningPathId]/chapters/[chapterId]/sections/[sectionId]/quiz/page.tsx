// فایل: app/(dashboard)/learning-paths/[learningPathId]/chapters/[chapterId]/sections/[sectionId]/quiz/page.tsx
"use server";

import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// ۱. کامپوننت Breadcrumbs را وارد می‌کنیم
import { Breadcrumbs, BreadcrumbItem } from "@/components/Breadcrumbs";

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

  // ۲. کوئری را برای دریافت کل مسیر از آزمون تا دوره اصلاح می‌کنیم
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
      // این بخش برای دریافت نام‌ها برای Breadcrumbs اضافه شده است
      section: {
        include: {
          chapter: {
            include: {
              level: {
                include: {
                  learningPath: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!quiz || !quiz.section?.chapter?.level?.learningPath) {
    return redirect(`/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}`);
  }

  // ۳. آیتم‌های Breadcrumb را با داده‌های کامل تعریف می‌کنیم
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "مسیرهای یادگیری", href: "/dashboard" },
    { label: quiz.section.chapter.level.learningPath.title, href: `/learning-paths/${learningPathId}/edit` },
    { label: quiz.section.chapter.title, href: `/learning-paths/${learningPathId}/chapters/${chapterId}` },
    { label: quiz.section.title, href: `/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}` },
    { label: "مدیریت آزمون", href: `/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}/quiz` },
  ];

  return (
    <div className="p-6">
      {/* ۴. کامپوننت Breadcrumbs را در بالای صفحه قرار می‌دهیم */}
      <Breadcrumbs items={breadcrumbItems} />

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
          <div className="p-4 bg-slate-100 rounded-md">
            <p className="font-bold">عنوان آزمون:</p>
            <p>{quiz.title}</p>
          </div>
        </div>
        <div className="space-y-4">
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