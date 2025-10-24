// فایل: app/(dashboard)/learning-paths/[learningPathId]/chapters/[chapterId]/_components/ChapterPageClient.tsx
"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Prisma } from "@prisma/client";
import { Breadcrumbs, BreadcrumbItem } from "@/components/Breadcrumbs";
import { ChapterTitleForm } from "./ChapterTitleForm";
import { ChapterActions } from "./ChapterActions";
import { SectionsForm } from "./SectionsForm";
import { ChapterRatingAnalyticsCard } from "./ChapterRatingAnalyticsCard";
// +++ ۱. کامپوننت جدید را وارد کنید +++
import { ChapterAccessForm } from "./ChapterAccessForm";

type ChapterWithDetails = Prisma.ChapterGetPayload<{
  include: {
    sections: {
      include: {
        progress: {
          select: { rating: true };
        };
      };
    };
    level: {
      include: {
        learningPath: {
          select: { title: true };
        };
      };
    };
  };
}>;

interface ChapterPageClientProps {
  chapter: ChapterWithDetails;
  learningPathId: string;
  chapterId: string;
  allRatings: (number | null)[];
}

export const ChapterPageClient = ({
  chapter,
  learningPathId,
  chapterId,
  allRatings,
}: ChapterPageClientProps) => {

  const hasPublishedSection = chapter.sections.some(
    (section) => section.isPublished
  );

  const requiredFields = [chapter.title];
  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "مسیرهای یادگیری", href: "/dashboard" },
    {
      label: chapter.level.learningPath.title,
      href: `/learning-paths/${learningPathId}/edit`,
    },
    {
      label: chapter.title,
      href: `/learning-paths/${learningPathId}/chapters/${chapterId}`,
    },
  ];

  return (
    <div className="p-6">
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
            {/* +++ ۲. کامپوننت دسترسی را اینجا اضافه کنید +++ */}
            <ChapterAccessForm
              initialData={chapter}
              learningPathId={learningPathId}
              chapterId={chapterId}
            />
            <ChapterRatingAnalyticsCard ratings={allRatings} />
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
};