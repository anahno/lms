// فایل: app/(dashboard)/.../quiz/_components/QuizQuestionsForm.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Quiz, Question, Option, QuestionType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
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
  
  // --- ۱. تابع افزودن سوال را تغییر می‌دهیم تا نوع سوال را به عنوان ورودی بگیرد ---
  const onAddQuestion = async (type: QuestionType) => {
    try {
      setIsCreating(true);
      const text = type === QuestionType.SINGLE_CHOICE ? "سوال تک‌گزینه‌ای جدید" : "سوال چندگزینه‌ای جدید";
      await axios.post(`/api/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}/quiz/questions`, {
        text,
        type, // <-- نوع سوال را به API ارسال می‌کنیم
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

      toast("قابلیت ذخیره ترتیب جدید در حال توسعه است.");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        سوالات آزمون
        {/* --- ۲. دکمه را به یک DropdownMenu تبدیل می‌کنیم --- */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" disabled={isCreating}>
              <PlusCircle className="h-4 w-4 ml-2" />
              افزودن سوال
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onAddQuestion(QuestionType.SINGLE_CHOICE)}>
              تک گزینه‌ای
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddQuestion(QuestionType.MULTIPLE_CHOICE)}>
              چند گزینه‌ای
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {questions.length === 0 && (
        <p className="text-sm text-slate-500 italic mt-4">
          هنوز سوالی برای این آزمون اضافه نشده است.
        </p>
      )}

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