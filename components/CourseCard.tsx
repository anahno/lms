// فایل: components/CourseCard.tsx
import Image from "next/image";
import Link from "next/link";
import { Book, Layers } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CourseCardProps {
  id: string;
  title: string;
  imageUrl: string | null;
  chaptersLength: number;
  category: string | null;
}

export const CourseCard = ({
  id,
  title,
  imageUrl,
  chaptersLength,
  category,
}: CourseCardProps) => {
  return (
    <Link href={`/learning-paths/${id}/edit`}>
      <Card className="h-full overflow-hidden transition hover:shadow-lg">
        <CardHeader className="relative w-full aspect-video p-0">
          {imageUrl ? (
            <Image
              fill
              className="object-cover"
              alt={title}
              src={imageUrl}
            />
          ) : (
            <div className="h-full w-full bg-slate-200 flex items-center justify-center">
              <Book className="h-10 w-10 text-slate-500" />
            </div>
          )}
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="text-lg md:text-base font-medium group-hover:text-sky-700 transition line-clamp-2">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">{category}</p>
          <div className="my-3 flex items-center gap-x-2 text-sm md:text-xs">
            <div className="flex items-center gap-x-1 text-slate-500">
              <Layers className="h-4 w-4" />
              <span>
                {chaptersLength} {chaptersLength === 1 ? "فصل" : "فصل"}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          {/* در آینده می‌توانید قیمت یا وضعیت پیشرفت را اینجا نمایش دهید */}
        </CardFooter>
      </Card>
    </Link>
  );
};