"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import { QuestionType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import type { FullSubmission } from "../page";

// ... (بقیه کد فایل بدون تغییر)
interface GradingFormProps {
  initialData: FullSubmission;
}

type FormValues = {
  grades: Record<string, { score: string; feedback: string }>;
};

export const GradingForm = ({ initialData }: GradingFormProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultValues = initialData.quiz.questions.reduce((acc, question) => {
    if (question.type === QuestionType.ESSAY || question.type === QuestionType.AUDIO_RESPONSE) {
      const answer = initialData.answers.find(a => a.questionId === question.id);
      acc.grades[question.id] = {
        score: answer?.score?.toString() || "",
        feedback: answer?.feedback || "",
      };
    }
    return acc;
  }, { grades: {} } as FormValues);
  
  const form = useForm<FormValues>({ defaultValues });
  const { register, handleSubmit, formState: { errors } } = form;

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
        try {
            await axios.patch(`/api/grading/${initialData.id}`, data.grades);
            toast.success("نمرات با موفقیت ثبت و نهایی شد.");
            router.push("/grading");
            router.refresh();
        } catch {
            toast.error("مشکلی در ثبت نمرات پیش آمد.");
        }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {initialData.quiz.questions.map((question, index) => {
        const userAnswer = initialData.answers.find(
          (a) => a.questionId === question.id
        );

        return (
          <Card key={question.id} className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between bg-slate-100 p-4">
              <CardTitle className="text-lg">سوال {index + 1}</CardTitle>
              {userAnswer?.isCorrect !== null && (
                <div className={cn("flex items-center gap-x-2 text-sm font-bold",
                    userAnswer?.isCorrect ? "text-emerald-600" : "text-red-600"
                )}>
                    {userAnswer?.isCorrect ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                    <span>
                        {userAnswer?.score || 0} / {question.points}
                    </span>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="font-semibold" dangerouslySetInnerHTML={{ __html: question.text }} />

              <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-4">
                  <Label>پاسخ دانشجو</Label>
                  {question.type === QuestionType.ESSAY ? (
                      <div className="prose max-w-full text-sm"
                          dangerouslySetInnerHTML={{ __html: userAnswer?.textAnswer || "<i>پاسخی ثبت نشده است.</i>" }}
                      />
                  ) : (
                      <p className="text-sm text-gray-700">{userAnswer?.textAnswer || "پاسخی ثبت نشده است."}</p>
                  )}
              </div>
              
              {(question.type === QuestionType.ESSAY || question.type === QuestionType.AUDIO_RESPONSE) && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                      <div className="md:col-span-1 space-y-2">
                          <Label htmlFor={`score-${question.id}`}>نمره (از {question.points})</Label>
                          <Input
                            id={`score-${question.id}`}
                            type="number"
                            step="0.1"
                            max={question.points}
                            min={0}
                            {...register(`grades.${question.id}.score`, {
                                required: "نمره الزامی است",
                                valueAsNumber: true,
                                max: { value: question.points, message: `نمره باید کمتر یا مساوی ${question.points} باشد` },
                                min: { value: 0, message: "نمره نمی‌تواند منفی باشد" }
                            })}
                          />
                          {errors.grades?.[question.id]?.score && (
                            <p className="text-xs text-red-500">{errors.grades[question.id]?.score?.message}</p>
                          )}
                      </div>
                      <div className="md:col-span-3 space-y-2">
                          <Label htmlFor={`feedback-${question.id}`}>بازخورد (اختیاری)</Label>
                          <Textarea
                            id={`feedback-${question.id}`}
                            placeholder="بازخورد خود را برای این پاسخ بنویسید..."
                            {...register(`grades.${question.id}.feedback`)}
                          />
                      </div>
                  </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
            {isPending ? "در حال ثبت..." : "ثبت نهایی نمرات و اتمام تصحیح"}
        </Button>
      </div>
    </form>
  );
};