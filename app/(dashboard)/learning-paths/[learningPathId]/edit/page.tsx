// فایل: app/(dashboard)/learning-paths/[learningPathId]/edit/page.tsx

import { db } from "@/lib/db";
import { redirect } from "next/navigation";

// وارد کردن تمام کامپوننت‌های فرم
import { TitleForm } from "./_components/TitleForm";
import { DescriptionForm } from "./_components/DescriptionForm";
import { ImageForm } from "./_components/ImageForm";
import { CategoryForm } from "./_components/CategoryForm";
// ۱. --- حذف ChaptersForm و وارد کردن LevelsForm ---
import { LevelsForm } from "./_components/LevelsForm";
import { CourseActions } from "./_components/CourseActions";

export default async function EditLearningPathPage({
  params,
}: {
  params: { learningPathId: string }; // تایپ Promise را برای سادگی حذف می‌کنیم
}) {
  const { learningPathId } = params;

  // ۲. --- به‌روزرسانی query پریزما برای دریافت سطوح و فصل‌ها ---
  const [learningPath, categories] = await Promise.all([
    db.learningPath.findUnique({
      where: {
        id: learningPathId,
      },
      include: {
        // ساختار تودرتوی جدید را include می‌کنیم
        levels: {
          orderBy: {
            position: "asc",
          },
          include: {
            chapters: {
              orderBy: {
                position: "asc",
              },
            },
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

  // ۳. --- به‌روزرسانی منطق تکمیل دوره ---
  // یک دوره زمانی کامل است که حداقل یک فصل منتشر شده داشته باشد.
  // و هر فصل زمانی منتشر شده در نظر گرفته می‌شود که حداقل یک بخش (Section) منتشر شده داشته باشد.
  // فعلا برای سادگی، شرط را به داشتن حداقل یک فصل (حتی بدون بخش) تغییر می‌دهیم.
  // این منطق بعدا با اضافه شدن بخش‌ها کامل‌تر می‌شود.
  const hasPublishedChapter = learningPath.levels.some(level => 
    level.chapters.some(chapter => chapter.isPublished)
  );

  const requiredFields = [
    learningPath.title,
    learningPath.description,
    learningPath.imageUrl,
    learningPath.categoryId,
    hasPublishedChapter, // استفاده از متغیر جدید
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const isComplete = requiredFields.every(Boolean);

  return (
    <div className="p-6">
      {/* بخش هدر صفحه (بدون تغییر) */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-y-2">
          <h1 className="text-2xl font-bold">تنظیمات مسیر یادگیری</h1>
          <span className="text-sm text-slate-700">
            فیلدهای تکمیل شده ({completedFields}/{totalFields})
          </span>
        </div>
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
          {/* ۴. --- جایگزینی کامپوننت --- */}
          {/* به جای ChaptersForm از LevelsForm استفاده می‌کنیم */}
          <LevelsForm initialData={{ levels: learningPath.levels }} learningPathId={learningPath.id} />
        </div>
      </div>
    </div>
  );
}