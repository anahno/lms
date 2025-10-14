// فایل: components/CourseCard.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { Book, Layers, MoreHorizontal, Pencil, Trash, Lock } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { Button } from "@/components/ui/button";
import { ViewCourseButton } from "./ViewCourseButton";

interface CourseCardProps {
  id: string;
  title: string;
  imageUrl: string | null;
  chaptersLength: number;
  category: string | null;
  isPublished: boolean;
}

export const CourseCard = ({
  id,
  title,
  imageUrl,
  chaptersLength,
  category,
  isPublished,
}: CourseCardProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/learning-paths/${id}`);
      toast.success("مسیر یادگیری با موفقیت حذف شد.");
      router.refresh();
    } catch {
      toast.error("مشکلی در حذف پیش آمد.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative group h-full">
      <div className="inner-curve h-full rounded-2xl p-6 flex flex-col drop-shadow-lg transition-all duration-300 hover:drop-shadow-xl">
        
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                <MoreHorizontal className="h-5 w-5 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/learning-paths/${id}/edit`}>
                <DropdownMenuItem>
                  <Pencil className="h-4 w-4 ml-2" /> ویرایش
                </DropdownMenuItem>
              </Link>
              <ConfirmModal onConfirm={onDelete}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={isLoading} className="text-red-600 focus:text-red-600">
                  <Trash className="h-4 w-4 ml-2" /> حذف
                </DropdownMenuItem>
              </ConfirmModal>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* --- شروع تغییرات UI/UX --- */}
        <div className="flex flex-col items-center text-center flex-grow">
          {/* ۱. لینک حالا فقط بخش محتوایی اصلی را در بر می‌گیرد */}
          <Link href={`/learning-paths/${id}/edit`} className="w-full flex flex-col items-center">
            {/* ۲. پلیس‌هولدر تصویر بهبود یافته */}
            <div className="w-full aspect-video relative mb-4">
              {imageUrl ? (
                <Image fill className="object-contain" alt={title} src={imageUrl} />
              ) : (
                <div className="h-full w-full bg-slate-100 rounded-xl flex items-center justify-center">
                  <Book className="h-12 w-12 text-slate-300" />
                </div>
              )}
            </div>
            
            {/* ۳. سلسله‌مراتب بصری و فاصله‌گذاری متن‌ها بهینه شده */}
            <h3 className="text-2xl font-bold leading-tight text-slate-800 dark:text-white line-clamp-2">
              {title}
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              {category || "بدون دسته‌بندی"}
            </p>
          </Link>
          
          {/* ۴. اطلاعات تکمیلی (فصل‌ها) با mt-auto به پایین منتقل شده */}
          <div className="mt-auto pt-6 flex items-center justify-center gap-x-2 text-xs text-slate-500 font-semibold">
            <Layers className="h-4 w-4" />
            <span>{chaptersLength} فصل</span>
          </div>
        </div>
        {/* --- پایان تغییرات UI/UX --- */}

        {/* فضای خالی برای اینکه محتوا زیر برش نرود */}
        <div className="h-10 w-full shrink-0"></div>
      </div>
      
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 transform transition-all duration-300 ease-in-out opacity-0 translate-y-[-1rem] group-hover:opacity-100 group-hover:translate-y-[1.25rem]">
        {isPublished ? (
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