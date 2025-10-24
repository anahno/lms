
// فایل: components/CourseCatalogCard.tsx
"use client";

import Image from "next/image";
import { Book, Layers } from "lucide-react";
import { ViewCourseButton } from "./ViewCourseButton";
import { EnrollButton } from "./EnrollButton";
import Link from "next/link";

interface CourseCatalogCardProps {
  id: string;
  title: string;
  imageUrl: string | null;
  chaptersLength: number;
  category: string | null;
  isEnrolled: boolean;
  price: number | null;
  discountPrice: number | null;
}

export const CourseCatalogCard = ({
  id,
  title,
  imageUrl,
  chaptersLength,
  category,
  isEnrolled,
  price,
  discountPrice,
}: CourseCatalogCardProps) => {
  const hasDiscount = discountPrice && price && discountPrice < price;
  const finalPrice = hasDiscount ? discountPrice : price;

  let discountPercent = 0;
  if (hasDiscount) {
    discountPercent = Math.round(((price! - discountPrice!) / price!) * 100);
  }

  return (
    <div className="relative group h-full">
      {/* کل کارت یک لینک به صفحه جزئیات دوره است */}
      <Link href={`/courses/${id}`} className="cursor-pointer">
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
              {hasDiscount && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  {discountPercent}% تخفیف
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-bold leading-tight text-slate-800 line-clamp-2">
              {title}
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              {category || "بدون دسته‌بندی"}
            </p>

            <div className="mt-auto pt-6 flex flex-col items-center gap-y-2 w-full">
              <div className="flex items-center justify-center gap-x-2">
                {finalPrice !== null && finalPrice > 0 ? (
                  <>
                    {hasDiscount && (
                      <p className="text-slate-400 line-through">
                        {price?.toLocaleString("fa-IR")}
                      </p>
                    )}
                    <p className="font-bold text-lg text-slate-800">
                      {finalPrice.toLocaleString("fa-IR")} تومان
                    </p>
                  </>
                ) : (
                  <p className="font-bold text-lg text-emerald-600">
                    رایگان
                  </p>
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
      </Link>
      
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 transform transition-all duration-300 ease-in-out opacity-0 translate-y-[-1rem] group-hover:opacity-100 group-hover:translate-y-[1.25rem]">
        {isEnrolled ? (
          <ViewCourseButton learningPathId={id} />
        ) : (
          // +++ پراپرتی context="catalog" در اینجا پاس داده می‌شود +++
          <EnrollButton learningPathId={id} price={finalPrice} context="catalog" />
        )}
      </div>
    </div>
  );
};