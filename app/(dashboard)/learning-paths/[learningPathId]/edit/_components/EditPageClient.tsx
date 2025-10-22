// فایل: app/(dashboard)/learning-paths/[learningPathId]/edit/_components/EditPageClient.tsx
"use client";

import { useState } from "react";
import { Prisma, Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Eye, Pencil } from "lucide-react";

import { Breadcrumbs, BreadcrumbItem } from "@/components/Breadcrumbs";
import { TitleForm } from "./TitleForm";
import { DescriptionForm } from "./DescriptionForm";
import { ImageForm } from "./ImageForm";
import { CategoryForm } from "./CategoryForm";
import { IntroAudioForm } from "./IntroAudioForm";
import { LevelsForm } from "./LevelsForm";
import { CourseActions } from "./CourseActions";
import { WhatYouWillLearnForm } from "./WhatYouWillLearnForm";
import { CourseStructureTree } from "./CourseStructureTree";
import { CourseRatingAnalyticsCard } from "./CourseRatingAnalyticsCard";
// +++ شروع اصلاح کلیدی +++
import { DropOffAnalyticsCard } from "./DropOffAnalyticsCard";
// به جای DropOffStat، تایپ صحیح FunnelStat وارد می‌شود
import { type FunnelStat } from "@/actions/get-dropoff-stats"; 
// +++ پایان اصلاح کلیدی +++

type LearningPathWithStructure = Prisma.LearningPathGetPayload<{
  include: {
    levels: { include: { chapters: { include: { sections: { include: { progress: { select: { rating: true } } } } } } } };
  }
}>;

type CategoryWithOptions = Prisma.CategoryGetPayload<{
  include: { subcategories: true };
}>;

interface EditPageClientProps {
  learningPath: LearningPathWithStructure;
  categories: CategoryWithOptions[];
  completedFields: number;
  totalFields: number;
  isComplete: boolean;
  userRole: Role;
  allRatings: (number | null)[];
  funnelStats: FunnelStat[]; // نام پراپ صحیح است
}

export const EditPageClient = ({
  learningPath,
  categories,
  completedFields,
  totalFields,
  isComplete,
  userRole,
  allRatings,
  funnelStats, // نام پراپ صحیح است
}: EditPageClientProps) => {
  const [isTreeView, setIsTreeView] = useState(false);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "مسیرهای یادگیری", href: "/dashboard" },
    { label: learningPath.title, href: `/learning-paths/${learningPath.id}/edit` },
  ];

  return (
    <div className="p-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-y-2">
          <h1 className="text-2xl font-bold">تنظیمات مسیر یادگیری</h1>
          <span className="text-sm text-slate-700">
            فیلدهای تکمیل شده ({completedFields}/{totalFields})
          </span>
        </div>

        <div className="flex items-center gap-x-2">
          <Button variant="outline" onClick={() => setIsTreeView(prev => !prev)}>
            {isTreeView ? (
              <>
                <Pencil className="h-4 w-4 ml-2" />
                نمای ویرایش
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 ml-2" />
                نمایش درختی
              </>
            )}
          </Button>

          <CourseActions
            initialData={learningPath}
            learningPathId={learningPath.id}
            isComplete={isComplete}
            userRole={userRole}
          />
        </div>
      </div>

      {isTreeView ? (
        <div className="mt-8">
            <CourseStructureTree learningPath={learningPath} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
          {/* ستون سمت راست (در حالت RTL) */}
          <div className="space-y-6">
            <TitleForm initialData={learningPath} learningPathId={learningPath.id} />
            <DescriptionForm initialData={learningPath} learningPathId={learningPath.id} />
            <WhatYouWillLearnForm initialData={learningPath} learningPathId={learningPath.id} />
            <CategoryForm
              initialData={learningPath}
              learningPathId={learningPath.id}
              options={categories}
            />
            <IntroAudioForm
              initialData={learningPath}
              learningPathId={learningPath.id}
            />
            <CourseRatingAnalyticsCard ratings={allRatings} />
            <DropOffAnalyticsCard stats={funnelStats} />
          </div>
          {/* ستون سمت چپ (در حالت RTL) */}
          <div className="space-y-6">
            <ImageForm initialData={learningPath} learningPathId={learningPath.id} />
            <LevelsForm initialData={{ levels: learningPath.levels }} learningPathId={learningPath.id} />
          </div>
        </div>
      )}
    </div>
  );
};