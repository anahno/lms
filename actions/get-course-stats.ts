// فایل: actions/get-course-stats.ts
"use server";

import { db } from "@/lib/db";

export type CourseStats = {
  overallAverage: number;
  chapterScores: {
    chapterTitle: string;
    score: number | null;
  }[];
};

export const getCourseStats = async (
  userId: string,
  learningPathId: string
): Promise<CourseStats | null> => {
  try {
    // مرحله ۱: کل ساختار دوره را برای پیدا کردن تمام آزمون‌ها و فصل‌ها واکشی می‌کنیم
    const courseStructure = await db.learningPath.findUnique({
      where: { id: learningPathId },
      include: {
        levels: {
          include: {
            chapters: {
              where: { isPublished: true },
              orderBy: { position: 'asc' },
              include: {
                quiz: { select: { id: true } }, // آزمون متصل به فصل
                sections: { // بخش‌های داخل فصل
                  where: { isPublished: true },
                  include: {
                    quiz: { select: { id: true } } // آزمون متصل به بخش
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!courseStructure) return null;

    // مرحله ۲: یک لیست صاف از تمام ID های آزمون‌های این دوره تهیه می‌کنیم
    const allQuizIdsInCourse: string[] = [];
    const chapters = courseStructure.levels.flatMap(l => l.chapters);
    
    chapters.forEach(chapter => {
      if (chapter.quiz) allQuizIdsInCourse.push(chapter.quiz.id);
      chapter.sections.forEach(section => {
        if (section.quiz) allQuizIdsInCourse.push(section.quiz.id);
      });
    });

    // مرحله ۳: حالا با لیست ID ها، یک کوئری ساده و مستقیم به QuizSubmission می‌زنیم
    const submissions = await db.quizSubmission.findMany({
      where: {
        userId: userId,
        score: { not: null },
        quizId: { in: allQuizIdsInCourse.length > 0 ? allQuizIdsInCourse : undefined },
      },
      select: { score: true, quizId: true }
    });

    // مرحله ۴: محاسبه میانگین کل
    const allScores = submissions.map(s => s.score as number);
    const overallAverage = allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0;


    // مرحله ۵: اتصال هوشمندانه نمرات به فصل‌ها
    const chapterScores = chapters.map(chapter => {
      // تمام ID های آزمون‌های متعلق به این فصل (چه مستقیم چه از طریق بخش‌ها)
      const quizIdsInThisChapter: string[] = [];
      if (chapter.quiz) quizIdsInThisChapter.push(chapter.quiz.id);
      chapter.sections.forEach(s => {
        if (s.quiz) quizIdsInThisChapter.push(s.quiz.id);
      });

      // تمام نمرات مربوط به آزمون‌های این فصل را پیدا کن
      const scoresForThisChapter = submissions
        .filter(sub => quizIdsInThisChapter.includes(sub.quizId))
        .map(sub => sub.score as number);

      if (scoresForThisChapter.length === 0) {
        return { chapterTitle: chapter.title, score: null };
      }
      
      const chapterAverage = scoresForThisChapter.reduce((a, b) => a + b, 0) / scoresForThisChapter.length;
      return { chapterTitle: chapter.title, score: chapterAverage };
    });

    return {
      overallAverage,
      chapterScores,
    };

  } catch (error) {
    console.error("[GET_COURSE_STATS_ERROR]", error);
    return null;
  }
};