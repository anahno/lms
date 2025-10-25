// فایل: app/(public)/courses/[slug]/quiz/[quizId]/play/_components/QuizPlayer.tsx
"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Quiz, Question, Option, QuestionType } from "@prisma/client";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { TiptapEditor } from "@/components/tiptap/TiptapEditor";
import { cn } from "@/lib/utils";

import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";

// --- انواع داده (Types) ---
type EnrichedQuestion = Question & {
  options: Pick<Option, "id" | "text">[];
};

type QuizWithQuestionsAndOptions = Quiz & {
  questions: EnrichedQuestion[];
  learningPath?: { slug: string } | null;
};

interface QuizPlayerProps {
  quiz: QuizWithQuestionsAndOptions;
  learningPathId: string;
}

type AnswersState = Record<string, string | string[] | Record<string, string | null>>;
type TextPart = { type: 'text'; content: string } | { type: 'blank'; id: string };

// --- کامپوننت‌های کمکی برای Drag and Drop ---
const DraggableOption = ({ option }: { option: Pick<Option, "id" | "text"> }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: option.id });
  const style = transform ? { 
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 9999
  } : {};

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes} 
      className={cn(
        "p-3 border rounded-md bg-white shadow-sm cursor-grab touch-none transition-all w-full",
        isDragging && "shadow-lg scale-105"
      )}
    >
      {option.text}
    </div>
  );
};

const DroppableBlank = ({ blankId, children }: { blankId: string; children: React.ReactNode }) => {
  const { isOver, setNodeRef } = useDroppable({ id: blankId });
  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "inline-flex items-center justify-center align-middle min-w-[180px] h-12 mx-1 border-2 border-dashed rounded-md transition-colors",
        isOver ? "border-sky-500 bg-sky-100" : "border-slate-300 bg-slate-100"
      )}
    >
      {children}
    </div>
  );
};

// --- کامپوننت اصلی ---
export const QuizPlayer = ({ quiz, learningPathId }: QuizPlayerProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<AnswersState>({});
  const [droppedItems, setDroppedItems] = useState<Record<string, string | null>>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor));
  
  const totalQuestions = quiz.questions.length;
  const currentQuestion = quiz.questions[currentQuestionIndex];
  
  const progressPercentage = currentQuestion 
    ? ((currentQuestionIndex + 1) / totalQuestions) * 100 
    : 0;

  useEffect(() => {
    if (currentQuestion && currentQuestion.type === QuestionType.DRAG_INTO_TEXT) {
      const existingAnswer = selectedAnswers[currentQuestion.id] as Record<string, string | null>;
      setDroppedItems(existingAnswer || {});
    }
  }, [currentQuestion, currentQuestionIndex, selectedAnswers]);

  const textParts: TextPart[] = useMemo(() => {
    if (currentQuestion && currentQuestion.type === QuestionType.DRAG_INTO_TEXT && currentQuestion.description) {
      try { return JSON.parse(currentQuestion.description); } catch { return []; }
    }
    return [];
  }, [currentQuestion]);
  
  if (!currentQuestion) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-100 p-4">
        <Card className="w-full max-w-6xl text-center">
          <CardHeader>
            <CardTitle>خطا</CardTitle>
          </CardHeader>
          <CardContent>
            <p>سوالی برای نمایش یافت نشد. ممکن است این آزمون هنوز سوالی نداشته باشد.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const optionId = active.id as string;
    const targetBlankId = over?.id as string | undefined;

    setDroppedItems(prev => {
      const newDropped = { ...prev };
      const sourceBlankId = Object.keys(newDropped).find(key => newDropped[key] === optionId);

      if (sourceBlankId) newDropped[sourceBlankId] = null;
      
      if (targetBlankId) {
        const displacedOptionId = newDropped[targetBlankId];
        if (sourceBlankId && displacedOptionId) {
          newDropped[sourceBlankId] = displacedOptionId;
        }
        newDropped[targetBlankId] = optionId;
      }
      return newDropped;
    });
  };
  
  const saveCurrentAnswer = () => {
    if (currentQuestion.type === QuestionType.DRAG_INTO_TEXT) {
      setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: droppedItems }));
    }
  };

  const handlePrevious = () => {
    saveCurrentAnswer();
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    saveCurrentAnswer();
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handleSubmit = () => {
    const finalAnswers = { ...selectedAnswers };
    if (currentQuestion.type === QuestionType.DRAG_INTO_TEXT) {
      finalAnswers[currentQuestion.id] = droppedItems;
    }
    
    startTransition(async () => {
      try {
        const courseSlug = quiz.learningPath?.slug;
        await axios.post(`/api/courses/${learningPathId}/quiz/${quiz.id}/submit`, { answers: finalAnswers });
        toast.success("آزمون شما برای بررسی ثبت شد!");
        if (courseSlug) {
          router.push(`/courses/${courseSlug}/quiz/${quiz.id}`);
        } else {
          router.push('/my-courses');
        }
        router.refresh();
      } catch {
        toast.error("مشکلی در ثبت آزمون پیش آمد.");
      }
    });
  };
  
  const allQuestionsAnswered = Object.keys(selectedAnswers).length === totalQuestions;
  
  const handleTextAnswerChange = (questionId: string, value: string) => setSelectedAnswers(prev => ({ ...prev, [questionId]: value }));
  const handleSingleChoiceSelect = (questionId: string, optionId: string) => setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));

  return (
    <div className="flex justify-center items-start min-h-screen bg-slate-100 p-4 overflow-visible">
      <Card className="w-full max-w-6xl overflow-visible">
        <CardHeader>
          <CardTitle className="text-center text-2xl mb-4">{quiz.title}</CardTitle>
          <Progress value={progressPercentage} />
          <p className="text-center text-sm text-slate-500 mt-2">سوال {currentQuestionIndex + 1} از {totalQuestions}</p>
        </CardHeader>
        
        <CardContent className="min-h-[400px] overflow-visible">
          <p className="text-lg font-semibold mb-6">{currentQuestion.text}</p>
          
          {currentQuestion.type === QuestionType.ESSAY && (
            <TiptapEditor 
              value={(selectedAnswers[currentQuestion.id] as string) || ""} 
              onChange={(value) => handleTextAnswerChange(currentQuestion.id, value)} 
            />
          )}
          
          {currentQuestion.type === QuestionType.FILL_IN_THE_BLANK && (
            <Input 
              placeholder="پاسخ خود را اینجا تایپ کنید..." 
              value={(selectedAnswers[currentQuestion.id] as string) || ""} 
              onChange={(e) => handleTextAnswerChange(currentQuestion.id, e.target.value)} 
            />
          )}
          
          {currentQuestion.type === QuestionType.SINGLE_CHOICE && (
            <RadioGroup 
              value={(selectedAnswers[currentQuestion.id] as string) || ""} 
              onValueChange={(value) => handleSingleChoiceSelect(currentQuestion.id, value)}
            >
              {currentQuestion.options.map(option => (
                <div key={option.id} className="flex items-center space-x-2 space-x-reverse mb-4">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="text-base cursor-pointer">{option.text}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
          
          {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && (
            <div className="space-y-4">
              {/* ... */}
            </div>
          )}

          {currentQuestion.type === QuestionType.DRAG_INTO_TEXT && (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-12 gap-6 overflow-visible">
                {/* بخش متن سوال - 8 ستون */}
                <div className="col-span-12 lg:col-span-8 overflow-visible">
                  <div className="p-6 border rounded-lg bg-slate-50 overflow-visible">
                    <div className="text-xl leading-loose text-right flex flex-wrap items-center gap-y-4 overflow-visible">
                      {textParts.map((part, index) =>
                        part.type === "text" ? (
                          <span key={index} className="leading-10">{part.content}</span>
                        ) : (
                          <DroppableBlank key={index} blankId={part.id}>
                            {droppedItems[part.id] && (
                              <DraggableOption 
                                option={currentQuestion.options.find(opt => opt.id === droppedItems[part.id])!} 
                              />
                            )}
                          </DroppableBlank>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* بخش گزینه‌ها - 4 ستون سمت چپ */}
                <div className="col-span-12 lg:col-span-4 overflow-visible">
                  <div className="p-4 border rounded-lg bg-white sticky top-4">
                    <h3 className="text-sm font-semibold text-slate-600 mb-3">گزینه‌ها</h3>
                    <div className="space-y-3">
                      {currentQuestion.options
                        .filter(opt => !Object.values(droppedItems).includes(opt.id))
                        .map((option) => (
                          <DraggableOption key={option.id} option={option} />
                        ))}
                    </div>
                    {currentQuestion.options.filter(opt => !Object.values(droppedItems).includes(opt.id)).length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-4">همه گزینه‌ها استفاده شده‌اند</p>
                    )}
                  </div>
                </div>
              </div>
            </DndContext>
          )}
        </CardContent>
        
        <CardFooter className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevious} 
            disabled={currentQuestionIndex === 0}
          >
            سوال قبلی
          </Button>
          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button onClick={handleNext}>سوال بعدی</Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isPending || !allQuestionsAnswered}
            >
              {isPending ? "در حال ثبت..." : "پایان و ثبت آزمون"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};