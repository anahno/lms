// فایل: components/CourseCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { Book, Layers, Lock, Clock } from "lucide-react";
import { CourseStatus } from "@prisma/client";
import { ViewCourseButton } from "./ViewCourseButton";
import { Badge } from "./ui/badge";

interface CourseCardProps {
  id: string;
  title: string;
  imageUrl: string | null;
  chaptersLength: number;
  category: string | null;
  status: CourseStatus;
}

export const CourseCard = ({
  id,
  title,
  imageUrl,
  chaptersLength,
  category,
  status,
}: CourseCardProps) => {
  
  const statusInfo = {
    [CourseStatus.DRAFT]: { text: "پیش‌نویس", variant: "secondary" as const },
    [CourseStatus.PENDING]: { text: "در انتظار تایید", variant: "outline" as const },
    [CourseStatus.PUBLISHED]: { text: "منتشر شده", variant: "success" as const },
  };

  return (
    <div className="relative group h-full">
      <div className="inner-curve h-full rounded-2xl p-6 flex flex-col drop-shadow-lg transition-all duration-300 hover:drop-shadow-xl">
        
        <div className="flex justify-between items-start">
            <Badge variant={statusInfo[status].variant}>
                {status === "PENDING" && <Clock className="h-3 w-3" />}
                {statusInfo[status].text}
            </Badge>
            {/* Dropdown Menu برای ویرایش و حذف در اینجا قرار خواهد گرفت */}
        </div>

        <div className="flex flex-col items-center text-center flex-grow mt-4">
          <Link href={`/learning-paths/${id}/edit`} className="w-full flex flex-col items-center">
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
          </Link>
          
          <div className="mt-auto pt-6 flex items-center justify-center gap-x-2 text-xs text-slate-500 font-semibold">
            <Layers className="h-4 w-4" />
            <span>{chaptersLength} فصل</span>
          </div>
        </div>

        <div className="h-10 w-full shrink-0"></div>
      </div>
      
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 transform transition-all duration-300 ease-in-out opacity-0 translate-y-[-1rem] group-hover:opacity-100 group-hover:translate-y-[1.25rem]">
        {status === "PUBLISHED" ? (
          <ViewCourseButton learningPathId={id} />
        ) : (
          <div className="rounded-full w-16 h-16 shadow-lg bg-gray-100 flex items-center justify-center border border-gray-200 cursor-not-allowed" title="منتشر نشده">
            <Lock className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
};