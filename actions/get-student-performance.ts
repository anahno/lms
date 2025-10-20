// فایل: actions/get-student-performance.ts
"use server";

import { db } from "@/lib/db";

// تعریف نوع داده خروجی برای استفاده در کلاینت
export type StudentPerformance = {
  id: string;
  name: string;
  email: string;
  averageScore: number;
  submissions: {
    quizTitle: string;
    score: number | null;
  }[];
};

export const getStudentPerformance = async (
  learningPathId: string
): Promise<StudentPerformance[]> => {
  try {
    // ۱. تمام آزمون‌های داخل این دوره را پیدا می‌کنیم
    const courseWithQuizzes = await db.learningPath.findUnique({
      where: { id: learningPathId },
      include: {
        levels: {
          include: {
            chapters: {
              include: {
                sections: {
                  where: { isPublished: true },
                  include: { quiz: { select: { id: true, title: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!courseWithQuizzes) return [];

    const allQuizzesInCourse = courseWithQuizzes.levels
      .flatMap(l => l.chapters)
      .flatMap(c => c.sections)
      .map(s => s.quiz)
      .filter((q): q is { id: string; title: string } => q !== null);
      
    const allQuizIds = allQuizzesInCourse.map(q => q.id);

    // ۲. تمام دانشجویان ثبت‌نام کرده در دوره را پیدا می‌کنیم
    const enrollments = await db.enrollment.findMany({
      where: { learningPathId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // ۳. برای هر دانشجو، نمرات او را واکشی و معدل را محاسبه می‌کنیم
    const performanceData = await Promise.all(
      enrollments.map(async (enrollment) => {
        const userId = enrollment.user.id;
        
        const submissions = await db.quizSubmission.findMany({
          where: {
            userId: userId,
            quizId: { in: allQuizIds },
            score: { not: null },
          },
          select: { score: true, quizId: true }
        });

        const validScores = submissions.map(s => s.score as number);
        const averageScore = validScores.length > 0
          ? validScores.reduce((a, b) => a + b, 0) / validScores.length
          : 0;

        // ۴. نمرات هر آزمون را با عنوان آن تطبیق می‌دهیم
        const submissionsWithTitles = allQuizzesInCourse.map(quiz => {
          const submission = submissions.find(s => s.quizId === quiz.id);
          return {
            quizTitle: quiz.title,
            score: submission?.score ?? null, // اگر شرکت نکرده، نمره null است
          };
        });

        return {
          id: userId,
          name: enrollment.user.name || "کاربر بی‌نام",
          email: enrollment.user.email || "ایمیل نامشخص",
          averageScore: averageScore,
          submissions: submissionsWithTitles,
        };
      })
    );
    
    // بر اساس بیشترین معدل مرتب می‌کنیم
    return performanceData.sort((a, b) => b.averageScore - a.averageScore);

  } catch (error) {
    console.error("[GET_STUDENT_PERFORMANCE_ERROR]", error);
    return [];
  }
};