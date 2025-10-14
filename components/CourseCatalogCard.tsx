// فایل: components/CourseCatalogCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { Book, Layers } from "lucide-react";
import { ViewCourseButton } from "./ViewCourseButton";

interface CourseCatalogCardProps {
  id: string;
  title: string;
  imageUrl: string | null;
  chaptersLength: number;
  category: string | null;
}

export const CourseCatalogCard = ({
  id,
  title,
  imageUrl,
  chaptersLength,
  category,
}: CourseCatalogCardProps) => {
  return (
    <div className="relative group h-full">
      <div className="inner-curve h-full rounded-2xl p-6 flex flex-col drop-shadow-lg transition-all duration-300 hover:drop-shadow-xl">
        <div className="flex flex-col items-center text-center flex-grow">
          {/* این کارت در حالت عادی به جایی لینک نمی‌شود، دکمه ورود کار اصلی را انجام می‌دهد */}
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
      
      {/* دکمه ورود به دوره که همیشه فعال است */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 transform transition-all duration-300 ease-in-out opacity-0 translate-y-[-1rem] group-hover:opacity-100 group-hover:translate-y-[1.25rem]">
        <ViewCourseButton learningPathId={id} />
      </div>
    </div>
  );
};