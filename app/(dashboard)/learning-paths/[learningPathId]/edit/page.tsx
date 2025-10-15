// فایل: app/(dashboard)/learning-paths/[learningPathId]/edit/page.tsx

import { db } from "@/lib/db";
import { redirect } from "next/navigation";

// وارد کردن تمام کامپوننت‌های فرم
import { TitleForm } from "./_components/TitleForm";
import { DescriptionForm } from "./_components/DescriptionForm";
import { ImageForm } from "./_components/ImageForm";
import { CategoryForm } from "./_components/CategoryForm";
import { LevelsForm } from "./_components/LevelsForm";
import { CourseActions } from "./_components/CourseActions";
import { WhatYouWillLearnForm } from "./_components/WhatYouWillLearnForm"; // ایمپورت جدید

export default async function EditLearningPathPage({
  params,
}: {
  params: { learningPathId: string };
}) {
  const { learningPathId } = params;

  // دریافت تمام اطلاعات لازم با Query های به‌روز شده
  const [learningPath, categories] = await Promise.all([
    db.learningPath.findUnique({
      where: {
        id: learningPathId,
      },
      include: {
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
      where: {
        parentId: null, // فقط دسته‌بندی‌های اصلی
      },
      include: {
        subcategories: { // به همراه زیرمجموعه‌ها
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!learningPath) {
    return redirect("/");
  }

  // منطق تکمیل بودن دوره بر اساس ساختار جدید
  const hasPublishedChapter = learningPath.levels.some(level => 
    level.chapters.some(chapter => chapter.isPublished)
  );

  const requiredFields = [
    learningPath.title,
    learningPath.description,
    learningPath.imageUrl,
    learningPath.categoryId,
    hasPublishedChapter,
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
                    <WhatYouWillLearnForm initialData={learningPath} learningPathId={learningPath.id} />

          <CategoryForm
            initialData={learningPath}
            learningPathId={learningPath.id}
            options={categories} // پاس دادن داده‌های ساختار یافته به فرم
          />
        </div>
        <div className="space-y-6">
          <ImageForm initialData={learningPath} learningPathId={learningPath.id} />
          <LevelsForm initialData={{ levels: learningPath.levels }} learningPathId={learningPath.id} />
        </div>
      </div>
    </div>
  );
}