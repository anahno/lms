// فایل: app/(public)/courses/[learningPathId]/quiz/[quizId]/page.tsx
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, HelpCircle, FileText } from "lucide-react";

export default async function QuizStartPage({
  params,
}: {
  params: { learningPathId: string; quizId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirect("/login");
  }
  const userId = session.user.id;

  // ۱. بررسی اینکه آیا دانشجو در این دوره ثبت‌نام کرده است
  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_learningPathId: {
        userId,
        learningPathId: params.learningPathId,
      },
    },
  });
  if (!enrollment) {
    return redirect(`/courses/${params.learningPathId}`);
  }

  // ۲. واکشی اطلاعات آزمون و بررسی اینکه آیا دانشجو قبلا این آزمون را انجام داده
  const quiz = await db.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      questions: { select: { id: true } }, // فقط تعداد سوالات را لازم داریم
      submissions: {
        where: { userId },
      },
    },
  });

  if (!quiz) {
    return redirect(`/courses/${params.learningPathId}`);
  }

  const hasSubmitted = quiz.submissions.length > 0;
  const submission = hasSubmitted ? quiz.submissions[0] : null;

  return (
    <div className="flex justify-center items-start pt-10">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <CardTitle className="text-3xl">{quiz.title}</CardTitle>
          <CardDescription className="mt-2">
            این آزمون برای ارزیابی دانش شما از بخش مربوطه طراحی شده است.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-around items-center p-4 my-6 bg-slate-100 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <HelpCircle className="h-8 w-8 text-sky-600" />
              <span className="font-bold">{quiz.questions.length}</span>
              <span className="text-sm text-slate-600">سوال</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-8 w-8 text-amber-600" />
              <span className="font-bold">تک گزینه‌ای</span>
              <span className="text-sm text-slate-600">نوع سوالات</span>
            </div>
            {hasSubmitted && (
               <div className="flex flex-col items-center gap-2">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
                <span className="font-bold">{submission?.score?.toFixed(0) || 0} / 100</span>
                <span className="text-sm text-slate-600">نمره شما</span>
              </div>
            )}
          </div>
          
          <div className="mt-8">
            {hasSubmitted ? (
              <div className="space-y-4">
                 <p className="text-lg font-semibold text-emerald-700">شما قبلاً در این آزمون شرکت کرده‌اید!</p>
                 <Button className="w-full" asChild>
                   {/* در آینده این لینک به صفحه نتایج دقیق خواهد رفت */}
                   <Link href={`/courses/${params.learningPathId}`}>بازگشت به دوره</Link>
                 </Button>
              </div>
            ) : (
              <Button className="w-full" size="lg" asChild>
                {/* این لینک کاربر را به صفحه انجام آزمون می‌برد که در مرحله بعد می‌سازیم */}
                <Link href={`/courses/${params.learningPathId}/quiz/${params.quizId}/play`}>
                  شروع آزمون
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}