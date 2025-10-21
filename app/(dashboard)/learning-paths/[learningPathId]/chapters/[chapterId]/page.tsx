// فایل: app/(dashboard)/learning-paths/[learningPathId]/chapters/[chapterId]/page.tsx
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// ۱. کامپوننت Breadcrumbs را وارد می‌کنیم
import { Breadcrumbs, BreadcrumbItem } from "@/components/Breadcrumbs";

import { ChapterTitleForm } from "./_components/ChapterTitleForm";
import { ChapterActions } from "./_components/ChapterActions";
import { SectionsForm } from "./sections/[sectionId]/_components/SectionsForm";

export default async function ChapterIdPage({
  params,
}: {
  params: Promise<{ learningPathId: string; chapterId: string }>;
}) {
  const { learningPathId, chapterId } = await params;

  // ۲. کوئری را اصلاح می‌کنیم تا نام دوره والد را هم دریافت کند
  const chapter = await db.chapter.findUnique({
    where: {
      id: chapterId,
      level: {
        learningPathId: learningPathId,
      }
    },
    include: {
      sections: {
        orderBy: {
          position: "asc",
        },
      },
      // این بخش برای دریافت نام دوره برای Breadcrumbs اضافه شده است
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
  });

  if (!chapter || !chapter.level.learningPath) {
    return redirect("/");
  }

  const hasPublishedSection = chapter.sections.some(section => section.isPublished);
  
  const requiredFields = [chapter.title];
  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;

  // ۳. آیتم‌های Breadcrumb را با داده‌های جدید تعریف می‌کنیم
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "مسیرهای یادگیری", href: "/dashboard" },
    { label: chapter.level.learningPath.title, href: `/learning-paths/${learningPathId}/edit` },
    { label: chapter.title, href: `/learning-paths/${learningPathId}/chapters/${chapterId}` },
  ];

  return (
    <div className="p-6">
      {/* ۴. کامپوننت Breadcrumbs را در بالای صفحه قرار می‌دهیم */}
      <Breadcrumbs items={breadcrumbItems} />

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
              <h1 className="text-2xl font-medium">تنظیمات فصل</h1>
              <span className="text-sm text-slate-700">
                فیلدهای الزامی را تکمیل کنید {completionText}
              </span>
            </div>
            <ChapterActions
              learningPathId={learningPathId}
              chapterId={chapterId}
              isPublished={chapter.isPublished}
              canPublish={hasPublishedSection}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
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
          </div>
        </div>
        <div className="space-y-4">
           <div>
            <div className="flex items-center gap-x-2 mb-4">
              <h2 className="text-xl">بخش‌های این فصل</h2>
            </div>
            <SectionsForm
                initialData={{ sections: chapter.sections }}
                learningPathId={learningPathId}
                chapterId={chapterId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}