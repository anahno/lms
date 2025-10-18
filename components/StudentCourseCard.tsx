// فایل: components/StudentCourseCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { Book, BarChart2 } from "lucide-react";
import { ViewCourseButton } from "./ViewCourseButton";
import { Progress } from "@/components/ui/progress";
import { Button } from "./ui/button";

interface StudentCourseCardProps {
  id: string;
  title: string;
  imageUrl: string | null;
  category: string | null;
  progress: number;
}

export const StudentCourseCard = ({
  id,
  title,
  imageUrl,
  category,
  progress,
}: StudentCourseCardProps) => {
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
          
          <h3 className="text-xl font-bold leading-tight text-slate-800 line-clamp-2">
            {title}
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            {category}
          </p>
          
          <div className="mt-auto pt-6 w-full space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-slate-500 font-semibold">
                  {Math.round(progress)}% تکمیل شده
              </p>
          </div>
        </div>
        
        <div className="mt-4 flex justify-center border-t pt-4">
            <Link href={`/my-courses/${id}/results`} legacyBehavior>
                <a className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                        <BarChart2 className="h-4 w-4 ml-2" />
                        مشاهده نمرات و آمار
                    </Button>
                </a>
            </Link>
        </div>

        <div className="h-10 w-full shrink-0"></div>
      </div>
      
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 transform transition-all duration-300 ease-in-out opacity-0 translate-y-[-1rem] group-hover:opacity-100 group-hover:translate-y-[1.25rem]">
        <ViewCourseButton learningPathId={id} />
      </div>
    </div>
  );
};