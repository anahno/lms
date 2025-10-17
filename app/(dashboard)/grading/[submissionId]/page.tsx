// فایل: app/(dashboard)/grading/[submissionId]/page.tsx
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GradingForm } from "./_components/GradingForm"; 
import type { QuizSubmission, User, Quiz, Question, UserAnswer, Option } from "@prisma/client";

// یک نوع پیچیده برای داده‌ها تعریف می‌کنیم تا از 'any' خلاص شویم
type FullQuestion = Question & { options: Option[] };
type FullQuiz = Quiz & { questions: FullQuestion[] };
export type FullSubmission = QuizSubmission & {
  user: User;
  quiz: FullQuiz;
  answers: UserAnswer[];
};

export default async function GradeSubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirect("/login");
  }

  const { submissionId } = await params;
  const userRole = (session.user as unknown as { role: Role }).role;
  const userId = session.user.id;

  const submission = await db.quizSubmission.findUnique({
    where: {
      id: submissionId,
      quiz: {
        section: {
          chapter: {
            level: {
              learningPath:
                userRole === "INSTRUCTOR" ? { userId: userId } : {},
            },
          },
        },
      },
    },
    include: {
      user: true,
      quiz: {
        include: {
          questions: {
            orderBy: { position: "asc" },
            include: {
              options: true,
            },
          },
        },
      },
      answers: true,
    },
  });

  if (!submission) {
    return redirect("/grading");
  }

  return (
    <div className="p-6">
      <Link
        href="/grading"
        className="flex items-center text-sm text-slate-600 hover:text-slate-800 transition mb-6"
      >
        <ArrowLeft className="h-4 w-4 ml-2" />
        بازگشت به مرکز نمره‌دهی
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">تصحیح آزمون</h1>
        <div className="flex items-center gap-x-4 text-sm text-muted-foreground mt-2">
          <span>
            <strong>دانشجو:</strong> {submission.user.name || submission.user.email}
          </span>
          <span>
            <strong>آزمون:</strong> {submission.quiz.title}
          </span>
        </div>
      </div>
      
      {/* حالا نوع داده مشخص است و نیازی به 'as any' نیست */}
      <GradingForm initialData={submission as FullSubmission} />
    </div>
  );
}