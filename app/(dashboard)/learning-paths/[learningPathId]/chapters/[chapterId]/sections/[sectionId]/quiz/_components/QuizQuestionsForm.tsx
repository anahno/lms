// فایل: app/(dashboard)/.../quiz/_components/QuizQuestionsForm.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Quiz, Question, Option } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
// --- ۱. کامپوننت کارت سوال را وارد کنید ---
import { QuestionCard } from "./QuestionCard";

type QuizWithQuestions = Quiz & {
  questions: (Question & { options: Option[] })[];
};

interface QuizQuestionsFormProps {
  initialData: QuizWithQuestions;
  learningPathId: string;
  chapterId: string;
  sectionId: string;
}

export const QuizQuestionsForm = ({
  initialData,
  learningPathId,
  chapterId,
  sectionId,
}: QuizQuestionsFormProps) => {
  const [questions, setQuestions] = useState(initialData.questions);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setQuestions(initialData.questions);
  }, [initialData.questions]);
  
  const onAddQuestion = async () => {
    try {
      setIsCreating(true);
      await axios.post(`/api/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}/quiz/questions`, {
        text: "سوال جدید",
      });
      toast.success("سوال جدید اضافه شد.");
      router.refresh();
    } catch {
      toast.error("مشکلی پیش آمد.");
    } finally {
      setIsCreating(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over!.id);
      
      const updatedQuestions = arrayMove(questions, oldIndex, newIndex);
      setQuestions(updatedQuestions);

      // TODO: API call to update question positions on the server
      // const bulkUpdateData = updatedQuestions.map((q, index) => ({ id: q.id, position: index + 1 }));
      // await axios.put(`/api/.../quiz/questions/reorder`, { list: bulkUpdateData });
      toast("قابلیت ذخیره ترتیب جدید در حال توسعه است.");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        سوالات آزمون
        <Button onClick={onAddQuestion} variant="ghost" disabled={isCreating}>
          <PlusCircle className="h-4 w-4 ml-2" />
          افزودن سوال
        </Button>
      </div>
      
      {questions.length === 0 && (
        <p className="text-sm text-slate-500 italic mt-4">
          هنوز سوالی برای این آزمون اضافه نشده است.
        </p>
      )}

      {/* --- ۲. بخش نمایش کارت‌های سوال را با منطق Drag and Drop تکمیل کنید --- */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4 mt-4">
            {questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                learningPathId={learningPathId}
                chapterId={chapterId}
                sectionId={sectionId}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};