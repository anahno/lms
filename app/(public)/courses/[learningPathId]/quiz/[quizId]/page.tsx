// فایل: app/(public)/courses/[learningPathId]/quiz/[quizId]/page.tsx (نسخه اصلاح شده)
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
  // --- ۱. تایپ params را به Promise تغییر می‌دهیم ---
  params: Promise<{ learningPathId: string; quizId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirect("/login");
  }
  const userId = session.user.id;

  // --- ۲. در ابتدای کامپوننت، params را await می‌کنیم ---
  const { learningPathId, quizId } = await params;

  // ۱. بررسی اینکه آیا دانشجو در این دوره ثبت‌نام کرده است
  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_learningPathId: {
        userId,
        learningPathId: learningPathId, // <-- از متغیر جدید استفاده می‌کنیم
      },
    },
  });
  if (!enrollment) {
    return redirect(`/courses/${learningPathId}`); // <-- از متغیر جدید استفاده می‌کنیم
  }

  // ۲. واکشی اطلاعات آزمون و بررسی اینکه آیا دانشجو قبلا این آزمون را انجام داده
  const quiz = await db.quiz.findUnique({
    where: { id: quizId }, // <-- از متغیر جدید استفاده می‌کنیم
    include: {
      questions: { select: { id: true } },
      submissions: {
        where: { userId },
      },
    },
  });

  if (!quiz) {
    return redirect(`/courses/${learningPathId}`); // <-- از متغیر جدید استفاده می‌کنیم
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
          {/* ... (بقیه JSX بدون تغییر، چون از متغیرهای local استفاده می‌کند) ... */}
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
<Link href={`/courses/${learningPathId}`}>
  <Button className="w-full">بازگشت به دوره</Button>
</Link>

              </div>
            ) : (
<Link href={`/courses/${learningPathId}/quiz/${quizId}/play`}>
  <Button className="w-full" size="lg">شروع آزمون</Button>
</Link>

            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}