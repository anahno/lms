// فایل: app/(dashboard)/learning-paths/[learningPathId]/edit/_components/LevelsForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Level, Chapter } from "@prisma/client";
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
import { PlusCircle, Pencil, Grip, Trash } from "lucide-react";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { ChaptersList } from "./ChaptersList"; // این کامپوننت را در فایل بعدی می‌سازیم

const formSchema = z.object({
  title: z.string().min(1, { message: "عنوان الزامی است" }),
});

// تعریف یک تایپ برای Level که شامل Chapters هم باشد
type LevelWithChapters = Level & { chapters: Chapter[] };

interface LevelsFormProps {
  initialData: { levels: LevelWithChapters[] };
  learningPathId: string;
}

// کامپوننت داخلی برای هر آیتم قابل جابجایی (هر سطح)
function SortableLevelItem({
  level,
  learningPathId,
  onDelete,
  onUpdate,
}: {
  level: LevelWithChapters;
  learningPathId: string;
  onDelete: (levelId: string) => void;
  onUpdate: (levelId: string, newTitle: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(level.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: level.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : "auto", // آیتم در حال جابجایی را روی بقیه نمایش بده
  };

  const handleTitleSave = () => {
    if (newTitle && newTitle.trim() && newTitle !== level.title) {
      onUpdate(level.id, newTitle);
    }
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex flex-col gap-y-2 bg-slate-200 border-slate-300 border text-slate-700 rounded-md mb-4">
        {/* هدر سطح: عنوان، دستگیره جابجایی و دکمه‌ها */}
        <div className="flex items-center gap-x-2 p-3 font-medium border-b bg-slate-200">
          <div {...listeners} className="cursor-grab p-1 rounded-sm hover:bg-slate-300 transition">
            <Grip className="h-5 w-5 text-slate-500" />
          </div>
          {!isEditing ? (
            <p className="flex-1" onDoubleClick={() => setIsEditing(true)}>{level.title}</p>
          ) : (
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
              className="flex-1 bg-white"
              autoFocus
            />
          )}
          <div className="ml-auto flex items-center gap-x-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing((prev) => !prev)}>
              <Pencil className="h-4 w-4 hover:text-sky-700 transition" />
            </Button>
            <ConfirmModal onConfirm={() => onDelete(level.id)}>
              <Button size="sm" variant="ghost">
                <Trash className="h-4 w-4 text-red-600 hover:text-red-800 transition" />
              </Button>
            </ConfirmModal>
          </div>
        </div>
        
        {/* لیست فصل‌های مربوط به این سطح */}
        <div className="p-3">
          <ChaptersList
            levelId={level.id}
            learningPathId={learningPathId}
            initialChapters={level.chapters}
          />
        </div>
      </div>
    </div>
  );
}


// کامپوننت اصلی فرم
export const LevelsForm = ({ initialData, learningPathId }: LevelsFormProps) => {
  const [levels, setLevels] = useState(initialData.levels);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLevels(initialData.levels);
  }, [initialData.levels]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "" },
  });

  const { isSubmitting, isValid } = form.formState;
  const toggleCreating = () => setIsCreating((current) => !current);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post(`/api/learning-paths/${learningPathId}/levels`, values);
      toast.success("سطح جدید ایجاد شد.");
      toggleCreating();
      form.reset();
      router.refresh();
    } catch {
      toast.error("مشکلی در ایجاد سطح پیش آمد.");
    }
  };
  
  const onUpdate = async (levelId: string, title: string) => {
    try {
      await axios.patch(`/api/learning-paths/${learningPathId}/levels/${levelId}`, { title });
      toast.success("عنوان سطح به‌روزرسانی شد.");
      router.refresh();
    } catch {
      toast.error("مشکلی در به‌روزرسانی عنوان پیش آمد.");
    }
  };
  
  const onDelete = async (levelId: string) => {
    try {
      await axios.delete(`/api/learning-paths/${learningPathId}/levels/${levelId}`);
      toast.success("سطح با موفقیت حذف شد.");
      router.refresh();
    } catch {
      toast.error("مشکلی در حذف سطح پیش آمد.");
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
      const oldIndex = levels.findIndex((l) => l.id === active.id);
      const newIndex = levels.findIndex((l) => l.id === over!.id);
      
      const updatedLevels = arrayMove(levels, oldIndex, newIndex);
      setLevels(updatedLevels);

      const bulkUpdateData = updatedLevels.map((level, index) => ({
        id: level.id,
        position: index + 1,
      }));

      try {
        await axios.put(`/api/learning-paths/${learningPathId}/levels/reorder`, {
          list: bulkUpdateData,
        });
        toast.success("ترتیب سطح‌ها با موفقیت ذخیره شد.");
      } catch {
        toast.error("مشکلی در ذخیره ترتیب جدید پیش آمد.");
        setLevels(initialData.levels); // بازگرداندن به حالت اولیه در صورت خطا
      }
    }
  };

  return (
    <div className="relative mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        سطوح و فصل‌های مسیر یادگیری
        <Button onClick={toggleCreating} variant="ghost">
          {isCreating ? "انصراف" : <><PlusCircle className="h-4 w-4 ml-2" /> افزودن سطح</>}
        </Button>
      </div>

      {isCreating && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <Input disabled={isSubmitting} placeholder="مثال: بخش مقدماتی" {...form.register("title")} />
          <Button disabled={isSubmitting || !isValid} type="submit">ایجاد</Button>
        </form>
      )}

      {!isCreating && (
        <>
          {levels.length === 0 && <p className="text-sm text-slate-500 italic mt-2">هنوز سطحی اضافه نشده است.</p>}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={levels.map(l => l.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 mt-4">
                {levels.map((level) => (
                  <SortableLevelItem
                    key={level.id}
                    level={level}
                    learningPathId={learningPathId}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
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