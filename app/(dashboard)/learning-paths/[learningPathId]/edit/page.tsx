// فایل: app/(dashboard)/learning-paths/[learningPathId]/edit/page.tsx

import { db } from "@/lib/db";
import { redirect } from "next/navigation";

// وارد کردن تمام کامپوننت‌های فرم
import { TitleForm } from "./_components/TitleForm";
import { DescriptionForm } from "./_components/DescriptionForm";
import { ImageForm } from "./_components/ImageForm";
import { CategoryForm } from "./_components/CategoryForm";
import { ChaptersForm } from "./_components/ChaptersForm";
import { CourseActions } from "./_components/CourseActions"; // ۱. وارد کردن کامپوننت صحیح برای عملیات دوره

export default async function EditLearningPathPage({
  params,
}: {
  params: Promise<{ learningPathId: string }>;
}) {
  const { learningPathId } = await params;

  // دریافت تمام اطلاعات لازم
  const [learningPath, categories] = await Promise.all([
    db.learningPath.findUnique({
      where: {
        id: learningPathId,
      },
      include: {
        chapters: {
          orderBy: {
            position: "asc",
          },
        },
      },
    }),
    db.category.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!learningPath) {
    return redirect("/");
  }

  // تعریف فیلدهای ضروری برای انتشار
  const requiredFields = [
    learningPath.title,
    learningPath.description,
    learningPath.imageUrl,
    learningPath.categoryId,
    learningPath.chapters.some(chapter => chapter.isPublished),
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const isComplete = requiredFields.every(Boolean);

  return (
    <div className="p-6">
      {/* بخش هدر صفحه */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-y-2">
          <h1 className="text-2xl font-bold">تنظیمات مسیر یادگیری</h1>
          <span className="text-sm text-slate-700">
            فیلدهای تکمیل شده ({completedFields}/{totalFields})
          </span>
        </div>
        {/* ۲. استفاده از کامپوننت CourseActions در اینجا */}
        <CourseActions
          initialData={learningPath}
          learningPathId={learningPath.id}
          isComplete={isComplete}
        />
      </div>

      {/* بخش اصلی محتوا */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
        <div className="space-y-6">
          <TitleForm initialData={learningPath} learningPathId={learningPath.id} />
          <DescriptionForm initialData={learningPath} learningPathId={learningPath.id} />
          <CategoryForm
            initialData={learningPath}
            learningPathId={learningPath.id}
            options={categories.map((category) => ({
              label: category.name,
              value: category.id,
            }))}
          />
        </div>
        <div className="space-y-6">
          <ImageForm initialData={learningPath} learningPathId={learningPath.id} />
          <ChaptersForm initialData={{ chapters: learningPath.chapters }} learningPathId={learningPath.id} />
        </div>
      </div>
    </div>
  );
}