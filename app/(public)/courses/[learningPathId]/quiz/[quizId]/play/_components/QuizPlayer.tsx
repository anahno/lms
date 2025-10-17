// فایل: app/(public)/.../play/_components/QuizPlayer.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Quiz, Question, Option, QuestionType } from "@prisma/client";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input"; // ۱. Input را وارد می‌کنیم
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

type EnrichedQuestion = Question & {
  options: Pick<Option, "id" | "text">[];
};

type QuizWithQuestionsAndOptions = Quiz & {
  questions: EnrichedQuestion[];
};

interface QuizPlayerProps {
  quiz: QuizWithQuestionsAndOptions;
  learningPathId: string;
}

// این نوع بدون تغییر باقی می‌ماند چون پاسخ متنی هم یک رشته است
type AnswersState = Record<string, string | string[]>;

export const QuizPlayer = ({ quiz, learningPathId }: QuizPlayerProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<AnswersState>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const totalQuestions = quiz.questions.length;
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleMultiChoiceSelect = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => {
      const currentAnswers = (prev[questionId] as string[] | undefined) || [];
      const newAnswers = currentAnswers.includes(optionId)
        ? currentAnswers.filter(id => id !== optionId)
        : [...currentAnswers, optionId];
      return { ...prev, [questionId]: newAnswers };
    });
  };

  // ۲. یک تابع جدید برای مدیریت ورودی متنی اضافه می‌کنیم
  const handleTextAnswerChange = (questionId: string, value: string) => {
    setSelectedAnswers(prev => ({...prev, [questionId]: value }));
  };

  const handleSingleChoiceSelect = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await axios.post(`/api/courses/${learningPathId}/quiz/${quiz.id}/submit`, {
          answers: selectedAnswers,
        });
        toast.success("آزمون با موفقیت ثبت شد!");
        router.push(`/courses/${learningPathId}/quiz/${quiz.id}`);
        router.refresh();
      } catch (_error) {
        toast.error("مشکلی در ثبت آزمون پیش آمد.");
      }
    });
  };

  const canSubmit = Object.keys(selectedAnswers).length === totalQuestions;

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-100 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl mb-4">{quiz.title}</CardTitle>
          <Progress value={progressPercentage} />
          <p className="text-center text-sm text-slate-500 mt-2">سوال {currentQuestionIndex + 1} از {totalQuestions}</p>
        </CardHeader>
        <CardContent className="min-h-[250px]">
          <p className="text-lg font-semibold mb-6">{currentQuestion.text}</p>
          
          {/* ۳. یک بلاک جدید برای FILL_IN_THE_BLANK اضافه می‌کنیم */}
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
               <p className="text-xs text-slate-500 mb-2">می‌توانید بیش از یک گزینه را انتخاب کنید.</p>
              {currentQuestion.options.map(option => (
                <div key={option.id} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={option.id}
                    checked={((selectedAnswers[currentQuestion.id] as string[]) || []).includes(option.id)}
                    onCheckedChange={() => handleMultiChoiceSelect(currentQuestion.id, option.id)}
                  />
                  <Label htmlFor={option.id} className="text-base cursor-pointer">{option.text}</Label>
                </div>
              ))}
            </div>
          )}

        </CardContent>
        <CardFooter className="flex justify-between">
          <span className="text-sm text-slate-500">به تمام سوالات پاسخ دهید تا دکمه ثبت فعال شود.</span>
          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button onClick={handleNext}>سوال بعدی</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isPending || !canSubmit}>
              {isPending ? "در حال ثبت..." : "پایان و ثبت آزمون"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};