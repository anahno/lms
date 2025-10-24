// فایل: app/(public)/courses/[learningPathId]/quiz/[quizId]/play/page.tsx
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
// کامپوننت تعاملی آزمون را در مرحله بعد خواهیم ساخت
import { QuizPlayer } from "./_components/QuizPlayer";

export default async function QuizPlayPage({
  params,
}: {
  params: { learningPathId: string; quizId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirect("/login");
  }
  const userId = session.user.id;

  // بررسی ثبت‌نام و اینکه آیا کاربر قبلا آزمون را انجام داده
  const [enrollment, submission] = await Promise.all([
    db.enrollment.findUnique({
      where: { userId_learningPathId: { userId, learningPathId: params.learningPathId } },
    }),
    db.quizSubmission.findUnique({
      where: { userId_quizId: { userId, quizId: params.quizId } },
    }),
  ]);

  if (!enrollment || submission) {
    return redirect(`/courses/${params.learningPathId}/quiz/${params.quizId}`);
  }

  // واکشی اطلاعات آزمون بدون پاسخ‌های صحیح
  const quiz = await db.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: {
          options: {
            // نکته امنیتی: فقط متن و آی‌دی گزینه‌ها را می‌فرستیم
            select: { id: true, text: true },
          },
        },
      },
    },
  });

  if (!quiz || quiz.questions.length === 0) {
    return redirect(`/courses/${params.learningPathId}`);
  }

  return <QuizPlayer quiz={quiz} learningPathId={params.learningPathId} />;
}