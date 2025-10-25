// فایل: app/(public)/courses/[slug]/quiz/[quizId]/page.tsx
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, HelpCircle, FileText } from "lucide-react";
import { QuestionType } from "@prisma/client";

const getQuestionTypeDisplay = (types: QuestionType[]): string => {
  if (types.length === 0) return "نامشخص";
  const uniqueTypes = new Set(types);
  if (uniqueTypes.size > 1) return "ترکیبی";
  const type = uniqueTypes.values().next().value;
  switch (type) {
    case QuestionType.SINGLE_CHOICE: return "تک گزینه‌ای";
    case QuestionType.MULTIPLE_CHOICE: return "چند گزینه‌ای";
    case QuestionType.FILL_IN_THE_BLANK: return "جای خالی";
    case QuestionType.ESSAY: return "تشریحی";
    case QuestionType.AUDIO_RESPONSE: return "پاسخ صوتی";
    case QuestionType.DRAG_INTO_TEXT: return "کشیدن در متن";
    default: return "استاندارد";
  }
};

export default async function QuizStartPage({
  params,
}: {
  // +++ ۱. نوع پارامترها اصلاح شد +++
  params: Promise<{ slug: string; quizId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirect("/login");
  }
  const userId = session.user.id;

  // +++ ۲. پارامترهای صحیح از URL خوانده شد +++
  const { slug, quizId } = await params;

  // +++ ۳. ابتدا دوره را با slug پیدا می‌کنیم تا id آن را بدست آوریم +++
  const course = await db.learningPath.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!course) {
    return redirect("/courses"); // اگر دوره یافت نشد، به کاتالوگ برگرد
  }

  // +++ ۴. از course.id برای بررسی ثبت‌نام استفاده می‌کنیم +++
  const enrollment = await db.enrollment.findUnique({
    where: { userId_learningPathId: { userId, learningPathId: course.id } },
  });

  if (!enrollment) {
    return redirect(`/courses/${slug}`); // اگر ثبت‌نام نکرده بود، به صفحه دوره برگرد
  }

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: { select: { id: true, type: true } },
      submissions: { where: { userId } },
    },
  });

  if (!quiz) {
    return redirect(`/courses/${slug}`); // اگر آزمون یافت نشد، به صفحه دوره برگرد
  }
  
  const questionTypes = quiz.questions.map(q => q.type);
  const questionTypeDisplay = getQuestionTypeDisplay(questionTypes);

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
              <span className="font-bold">{questionTypeDisplay}</span>
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
                {/* +++ ۵. لینک‌ها با slug اصلاح شدند +++ */}
                <Link href={`/courses/${slug}`}>
                  <Button className="w-full">بازگشت به دوره</Button>
                </Link>
              </div>
            ) : (
              // +++ ۶. لینک‌ها با slug اصلاح شدند +++
              <Link href={`/courses/${slug}/quiz/${quizId}/play`}>
                <Button className="w-full" size="lg">شروع آزمون</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}