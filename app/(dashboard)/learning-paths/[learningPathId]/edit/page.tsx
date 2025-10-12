// فایل: app/(dashboard)/learning-paths/[learningPathId]/edit/page.tsx

import { db } from "@/lib/db";
import { redirect } from "next/navigation";

// وارد کردن تمام کامپوننت‌های فرم
import { TitleForm } from "./_components/TitleForm";
import { DescriptionForm } from "./_components/DescriptionForm";
import { ImageForm } from "./_components/ImageForm";
import { CategoryForm } from "./_components/CategoryForm";
import { ChaptersForm } from "./_components/ChaptersForm";

export default async function EditLearningPathPage({
  params,
}: {
  params: Promise<{ learningPathId: string }>;
}) {
  const { learningPathId } = await params;

  // ۱. دریافت همزمان تمام داده‌های مورد نیاز صفحه با یک درخواست بهینه
  const [learningPath, categories] = await Promise.all([
    db.learningPath.findUnique({
      where: {
        id: learningPathId,
      },
      // ۲. دریافت همزمان فصل‌های مرتبط با این مسیر یادگیری
      include: {
        chapters: {
          orderBy: {
            position: "asc", // مرتب‌سازی فصل‌ها بر اساس جایگاه
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

  // ۳. اگر مسیر یادگیری وجود نداشت، کاربر را هدایت کن
  if (!learningPath) {
    return redirect("/");
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-y-2">
          <h1 className="text-2xl font-bold">تنظیمات مسیر یادگیری</h1>
          <span className="text-sm text-slate-700">
            تمام بخش‌های مورد نیاز را تکمیل کنید.
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
        {/* ستون اول */}
        <div className="space-y-6">
          <TitleForm
            initialData={learningPath}
            learningPathId={learningPath.id}
          />
          <DescriptionForm
            initialData={learningPath}
            learningPathId={learningPath.id}
          />
          <CategoryForm
            initialData={learningPath}
            learningPathId={learningPath.id}
            options={categories.map((category) => ({
              label: category.name,
              value: category.id,
            }))}
          />
        </div>
        {/* ستون دوم */}
        <div className="space-y-6">
          <ImageForm
            initialData={learningPath}
            learningPathId={learningPath.id}
          />
          <ChaptersForm
            // ۴. پاس دادن داده‌های فصل‌ها به کامپوننت مربوطه
            initialData={{ chapters: learningPath.chapters }}
            learningPathId={learningPath.id}
          />
        </div>
      </div>
    </div>
  );
}