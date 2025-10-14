// فایل: components/CourseCard.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { Book, Layers, MoreHorizontal, Pencil, Trash } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <Card className="h-full overflow-hidden transition hover:shadow-lg flex flex-col">
      <Link href={`/learning-paths/${id}/edit`}>
        <CardHeader className="relative w-full aspect-video p-0">
          {imageUrl ? (
            <Image fill className="object-cover" alt={title} src={imageUrl} />
          ) : (
            <div className="h-full w-full bg-slate-200 flex items-center justify-center">
              <Book className="h-10 w-10 text-slate-500" />
            </div>
          )}
        </CardHeader>
      </Link>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start">
          <Link href={`/learning-paths/${id}/edit`} className="flex-1">
            <h3 className="text-lg md:text-base font-medium transition line-clamp-2 hover:text-sky-700">
              {title}
            </h3>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">باز کردن منو</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/learning-paths/${id}/edit`}>
                <DropdownMenuItem>
                  <Pencil className="h-4 w-4 ml-2" />
                  ویرایش
                </DropdownMenuItem>
              </Link>
              <ConfirmModal onConfirm={onDelete}>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  disabled={isLoading}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash className="h-4 w-4 ml-2" />
                  حذف
                </DropdownMenuItem>
              </ConfirmModal>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{category}</p>
        <div className="my-3 flex items-center gap-x-2 text-sm md:text-xs">
          <div className="flex items-center gap-x-1 text-slate-500">
            <Layers className="h-4 w-4" />
            <span>
              {chaptersLength} {chaptersLength === 1 ? "فصل" : "فصل"}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <Badge className={isPublished ? "bg-sky-700" : "bg-slate-500"}>
          {isPublished ? "منتشر شده" : "پیش‌نویس"}
        </Badge>
        
        {isPublished && (
            <ViewCourseButton learningPathId={id} />
        )}
      </CardFooter>
    </Card>
  );
};