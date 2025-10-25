// فایل: app/(public)/courses/[slug]/quiz/[quizId]/play/page.tsx
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { QuizPlayer } from "./_components/QuizPlayer";

export default async function QuizPlayPage({
  params,
}: {
  // +++ ۱. نوع پارامترها به Promise اصلاح شد +++
  params: Promise<{ slug: string; quizId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirect("/login");
  }
  const userId = session.user.id;

  // +++ ۲. قبل از هر کاری، params را await می‌کنیم تا به آبجکت واقعی تبدیل شود +++
  const resolvedParams = await params;

  // +++ ۳. ابتدا دوره را با resolvedParams.slug پیدا می‌کنیم +++
  const course = await db.learningPath.findUnique({
    where: { slug: resolvedParams.slug },
    select: { id: true },
  });

  if (!course) {
    return redirect("/courses");
  }

  // بررسی ثبت‌نام و اینکه آیا کاربر قبلا آزمون را انجام داده
  const [enrollment, submission] = await Promise.all([
    db.enrollment.findUnique({
      where: { userId_learningPathId: { userId, learningPathId: course.id } },
    }),
    db.quizSubmission.findUnique({
      // +++ ۴. از resolvedParams.quizId استفاده می‌کنیم +++
      where: { userId_quizId: { userId, quizId: resolvedParams.quizId } },
    }),
  ]);

  if (!enrollment || submission) {
    // +++ ۵. ریدایرکت با resolvedParams.slug اصلاح شد +++
    return redirect(`/courses/${resolvedParams.slug}/quiz/${resolvedParams.quizId}`);
  }

  // واکشی اطلاعات آزمون بدون پاسخ‌های صحیح
  const quiz = await db.quiz.findUnique({
    // +++ ۶. از resolvedParams.quizId استفاده می‌کنیم +++
    where: { id: resolvedParams.quizId },
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: {
          options: {
            select: { id: true, text: true },
          },
        },
      },
    },
  });

  if (!quiz || quiz.questions.length === 0) {
    // +++ ۷. ریدایرکت با resolvedParams.slug اصلاح شد +++
    return redirect(`/courses/${resolvedParams.slug}`);
  }

  return <QuizPlayer quiz={quiz} learningPathId={course.id} />;
}