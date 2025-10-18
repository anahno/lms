// فایل: components/CourseCatalogCard.tsx
"use client";

import Image from "next/image";
import { Book, Layers } from "lucide-react";
import { ViewCourseButton } from "./ViewCourseButton";
import { EnrollButton } from "./EnrollButton";

interface CourseCatalogCardProps {
  id: string;
  title: string;
  imageUrl: string | null;
  chaptersLength: number;
  category: string | null;
  isEnrolled: boolean;
}

export const CourseCatalogCard = ({
  id,
  title,
  imageUrl,
  chaptersLength,
  category,
  isEnrolled,
}: CourseCatalogCardProps) => {
  return (
    <div className="relative group h-full">
      {/* --- تغییر در اینجا: کلاس‌های border و border-slate-200 اضافه شد --- */}
      <div className="inner-curve h-full rounded-2xl p-6 flex flex-col drop-shadow-lg transition-all duration-300 hover:drop-shadow-xl border border-slate-200">
        <div className="flex flex-col items-center text-center flex-grow">
          <div className="w-full aspect-video relative mb-4">
            {imageUrl ? (
              <Image fill className="object-contain" alt={title} src={imageUrl} />
            ) : (
              <div className="h-full w-full bg-slate-100 rounded-xl flex items-center justify-center">
                <Book className="h-12 w-12 text-slate-300" />
              </div>
            )}
          </div>
          
          <h3 className="text-2xl font-bold leading-tight text-slate-800 dark:text-white line-clamp-2">
            {title}
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            {category || "بدون دسته‌بندی"}
          </p>
          
          <div className="mt-auto pt-6 flex items-center justify-center gap-x-2 text-xs text-slate-500 font-semibold">
            <Layers className="h-4 w-4" />
            <span>{chaptersLength} فصل</span>
          </div>
        </div>

        <div className="h-10 w-full shrink-0"></div>
      </div>
      
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 transform transition-all duration-300 ease-in-out opacity-0 translate-y-[-1rem] group-hover:opacity-100 group-hover:translate-y-[1.25rem]">
        {isEnrolled ? (
          <ViewCourseButton learningPathId={id} />
        ) : (
          <EnrollButton learningPathId={id} />
        )}
      </div>
    </div>
  );
};