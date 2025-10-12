// فایل: app/(dashboard)/learning-paths/[learningPathId]/edit/_components/ChaptersForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Chapter } from "@prisma/client";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Grip } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  title: z.string().min(1, { message: "عنوان الزامی است" }),
});

// کامپوننت جداگانه برای هر آیتم قابل جابجایی
function SortableChapterItem({
  chapter,
  learningPathId,
}: {
  chapter: Chapter;
  learningPathId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className="flex items-center gap-x-2 bg-slate-200 border-slate-300 border text-slate-700 rounded-md p-3"
      >
        <div {...listeners} className="cursor-grab p-1">
          <Grip className="h-5 w-5 text-slate-500" />
        </div>
        <p className="flex-1 font-medium">{chapter.title}</p>
        <div className="ml-auto flex items-center gap-x-2">
          <Badge className={!chapter.isPublished ? "bg-slate-500" : "bg-sky-700"}>
            {chapter.isPublished ? "منتشر شده" : "پیش‌نویس"}
          </Badge>
          <Link href={`/learning-paths/${learningPathId}/chapters/${chapter.id}`}>
            <Pencil className="h-4 w-4 hover:text-sky-700 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// کامپوننت اصلی
export const ChaptersForm = ({
  initialData,
  learningPathId,
}: {
  initialData: { chapters: Chapter[] };
  learningPathId: string;
}) => {
  const [chapters, setChapters] = useState(initialData.chapters);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setChapters(initialData.chapters);
  }, [initialData.chapters]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "" },
  });

  const { isSubmitting, isValid } = form.formState;
  const toggleCreating = () => setIsCreating((current) => !current);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post(`/api/learning-paths/${learningPathId}/chapters`, values);
      toast.success("فصل جدید ایجاد شد.");
      toggleCreating();
      form.reset();
      router.refresh();
    } catch {
      toast.error("مشکلی پیش آمد.");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = chapters.findIndex((c) => c.id === active.id);
      const newIndex = chapters.findIndex((c) => c.id === over!.id);
      
      const updatedChapters = arrayMove(chapters, oldIndex, newIndex);
      setChapters(updatedChapters);

      const bulkUpdateData = updatedChapters.map((chapter, index) => ({
        id: chapter.id,
        position: index + 1,
      }));

      try {
        await axios.put(`/api/learning-paths/${learningPathId}/chapters/reorder`, {
          list: bulkUpdateData,
        });
        toast.success("ترتیب فصل‌ها با موفقیت ذخیره شد.");
      } catch {
        toast.error("مشکلی در ذخیره ترتیب جدید پیش آمد.");
        setChapters(initialData.chapters); // بازگرداندن به حالت اولیه در صورت خطا
      }
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        فصل‌های مسیر یادگیری
        <Button onClick={toggleCreating} variant="ghost">
          {isCreating ? "انصراف" : <><PlusCircle className="h-4 w-4 ml-2" /> افزودن فصل</>}
        </Button>
      </div>

      {isCreating && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <Input disabled={isSubmitting} placeholder="مثال: مقدمه‌ای بر..." {...form.register("title")} />
          <Button disabled={isSubmitting || !isValid} type="submit">ایجاد</Button>
        </form>
      )}

      {!isCreating && (
        <>
          {chapters.length === 0 && <p className="text-sm text-slate-500 italic mt-2">هنوز فصلی اضافه نشده است.</p>}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={chapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 mt-4">
                {chapters.map((chapter) => (
                  <SortableChapterItem key={chapter.id} chapter={chapter} learningPathId={learningPathId} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );
};