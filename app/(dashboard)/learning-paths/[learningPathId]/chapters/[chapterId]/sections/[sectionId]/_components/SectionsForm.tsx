// فایل: app/(dashboard)/learning-paths/[learningPathId]/chapters/[chapterId]/_components/SectionsForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Section } from "@prisma/client";
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

// کامپوننت داخلی برای هر آیتم "بخش"
function SortableSectionItem({
  section,
  learningPathId,
  chapterId,
}: {
  section: Section;
  learningPathId: string;
  chapterId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center gap-x-2 bg-slate-200 border-slate-300 border text-slate-700 rounded-md p-3">
        <div {...listeners} className="cursor-grab p-1 rounded-sm hover:bg-slate-300 transition">
          <Grip className="h-5 w-5 text-slate-500" />
        </div>
        <p className="flex-1 font-medium">{section.title}</p>
        <div className="ml-auto flex items-center gap-x-2">
          <Badge className={!section.isPublished ? "bg-slate-500" : "bg-sky-700"}>
            {section.isPublished ? "منتشر شده" : "پیش‌نویس"}
          </Badge>
          {/* این لینک کاربر را به صفحه ویرایش جزئیات این "بخش" می‌برد */}
          <Link href={`/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${section.id}`}>
            <Pencil className="h-4 w-4 hover:text-sky-700 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// کامپوننت اصلی برای لیست بخش‌ها
export const SectionsForm = ({
  initialData,
  learningPathId,
  chapterId,
}: {
  initialData: { sections: Section[] };
  learningPathId: string;
  chapterId: string;
}) => {
  const [sections, setSections] = useState(initialData.sections);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setSections(initialData.sections);
  }, [initialData.sections]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "" },
  });

  const { isSubmitting, isValid } = form.formState;
  const toggleCreating = () => setIsCreating((current) => !current);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // صدا زدن API جدید برای ایجاد بخش
      await axios.post(`/api/learning-paths/${learningPathId}/chapters/${chapterId}/sections`, values);
      toast.success("بخش جدید ایجاد شد.");
      toggleCreating();
      form.reset();
      router.refresh();
    } catch {
      toast.error("مشکلی در ایجاد بخش پیش آمد.");
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
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over!.id);
      
      const updatedSections = arrayMove(sections, oldIndex, newIndex);
      setSections(updatedSections);

      const bulkUpdateData = updatedSections.map((section, index) => ({
        id: section.id,
        position: index + 1,
      }));

      try {
        // صدا زدن API جدید برای تغییر ترتیب بخش‌ها
        await axios.put(`/api/learning-paths/${learningPathId}/chapters/${chapterId}/sections/reorder`, {
          list: bulkUpdateData,
        });
        toast.success("ترتیب بخش‌ها با موفقیت ذخیره شد.");
      } catch {
        toast.error("مشکلی در ذخیره ترتیب جدید پیش آمد.");
        setSections(initialData.sections); // بازگرداندن به حالت اولیه
      }
    }
  };

  return (
    <div className="relative mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        بخش‌های این فصل
        <Button onClick={toggleCreating} variant="ghost">
          {isCreating ? "انصراف" : <><PlusCircle className="h-4 w-4 ml-2" /> افزودن بخش</>}
        </Button>
      </div>

      {isCreating && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <Input disabled={isSubmitting} placeholder="مثال: ویدیوی معرفی" {...form.register("title")} />
          <Button disabled={isSubmitting || !isValid} type="submit">ایجاد</Button>
        </form>
      )}

      {!isCreating && (
        <>
          {sections.length === 0 && <p className="text-sm text-slate-500 italic mt-2">هنوز بخشی برای این فصل اضافه نشده است.</p>}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 mt-4">
                {sections.map((section) => (
                  <SortableSectionItem
                    key={section.id}
                    section={section}
                    learningPathId={learningPathId}
                    chapterId={chapterId}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );
};