// فایل: components/CourseCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { Book, Layers, Lock, Clock, User, Tag } from "lucide-react";
import { CourseStatus, User as Instructor } from "@prisma/client";
import { ViewCourseButton } from "./ViewCourseButton";

interface CourseCardProps {
  id: string;
  title: string;
  imageUrl: string | null;
  chaptersLength: number;
  category: string | null;
  status: CourseStatus;
  instructor: Instructor;
  price: number | null | undefined; // <--- نوع پراپ صحیح است
  discountPrice: number | null | undefined; // <--- نوع پراپ صحیح است
}

export const CourseCard = ({
  id,
  title,
  imageUrl,
  chaptersLength,
  category,
  status,
  instructor,
  price,
  discountPrice,
}: CourseCardProps) => {
  
  const statusInfo = {
    [CourseStatus.DRAFT]: { text: "پیش‌نویس", className: "bg-slate-500" as const },
    [CourseStatus.PENDING]: { text: "در انتظار تایید", className: "bg-amber-500" as const },
    [CourseStatus.PUBLISHED]: { text: "منتشر شده", className: "bg-emerald-600" as const },
  };

  const hasDiscount = discountPrice && price && discountPrice < price;
  const finalPrice = hasDiscount ? discountPrice : price;

  return (
    <div className="relative group h-full">
      <div className="inner-curve h-full rounded-2xl p-6 flex flex-col drop-shadow-lg transition-all duration-300 hover:drop-shadow-xl border border-slate-200">
        
        {instructor && (
           <div className="absolute top-0 -right-1 bg-sky-600 text-white text-xs font-bold px-4 py-1 rounded-bl-lg shadow-md z-10">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {instructor.name || "استاد نامشخص"}
              </span>
            </div>
        )}

        <div className={`absolute top-0 -left-1 text-white text-xs font-bold px-4 py-1 rounded-br-lg shadow-md z-10 ${statusInfo[status].className}`}>
            <span className="flex items-center gap-1">
                {status === "PENDING" && <Clock className="h-3 w-3" />}
                {statusInfo[status].text}
            </span>
        </div>

        <div className="flex flex-col items-center text-center flex-grow pt-8">
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
            
            <h3 className="text-xl font-bold leading-tight text-slate-800 line-clamp-2">
              {title}
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              {category || "بدون دسته‌بندی"}
            </p>
          </Link>
          
          <div className="mt-auto pt-6 w-full space-y-3">
            <div className="flex items-center justify-center gap-x-2 text-slate-700 h-6">
              <Tag className="h-4 w-4 text-slate-500" />
              {finalPrice !== null && finalPrice !== undefined && finalPrice > 0 ? (
                <div className="flex items-center gap-x-2 text-sm">
                  {hasDiscount && (
                    <span className="text-slate-400 line-through">
                      {price?.toLocaleString("fa-IR")}
                    </span>
                  )}
                  <span className="font-semibold">
                    {finalPrice.toLocaleString("fa-IR")} تومان
                  </span>
                </div>
              ) : (
                <span className="font-semibold text-sm text-emerald-600">
                  رایگان
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-x-2 text-xs text-slate-500 font-semibold">
              <Layers className="h-4 w-4" />
              <span>{chaptersLength} فصل</span>
            </div>
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