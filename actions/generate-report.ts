// فایل: actions/generate-report.ts
"use server";

import { db } from "@/lib/db";
import { getProgress } from "./get-progress";

export type ReportType = "users" | "course_performance" | "student_progress" | "quiz_submissions";

function convertToCsv(data: any[]): string {
  if (data.length === 0) {
    return "";
  }
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map(header => {
      // ابتدا مطمئن می‌شویم که مقدار null یا undefined به رشته خالی تبدیل می‌شود
      const rawValue = row[header];
      let value = (rawValue === null || rawValue === undefined) ? "" : String(rawValue);

      // حالا که مطمئن هستیم value یک رشته است، آن را برای کاراکترهای خاص بررسی می‌کنیم
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        // دابل کوتیشن‌های داخلی را دو برابر می‌کنیم
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

export async function generateCsvReport(reportType: ReportType): Promise<string> {
  let data: any[] = [];

  // ... (تمام کدهای بخش switch case بدون تغییر باقی می‌ماند) ...
  // فقط برای کامل بودن کد، آن را دوباره اینجا قرار می‌دهم
  switch (reportType) {
    case "users": {
      const users = await db.user.findMany({
        select: {
          id: true, name: true, email: true, role: true, createdAt: true,
          experiencePoints: true, level: true,
          _count: { select: { enrollments: true, discussions: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      data = users.map(u => ({
        UserID: u.id, Name: u.name, Email: u.email, Role: u.role,
        RegistrationDate: u.createdAt.toISOString(), XP: u.experiencePoints, Level: u.level,
        CoursesEnrolled: u._count.enrollments, QuestionsAsked: u._count.discussions,
      }));
      break;
    }
    case "course_performance": {
      const courses = await db.learningPath.findMany({
        include: { user: { select: { name: true } }, _count: { select: { enrollments: true } } },
      });
      const processedCourses = await Promise.all(courses.map(async c => {
        const ratings = await db.userProgress.aggregate({
          where: { section: { chapter: { level: { learningPathId: c.id } } }, rating: { not: null } },
          _avg: { rating: true },
        });
        return {
          CourseID: c.id, Title: c.title, Instructor: c.user.name, Status: c.status,
          CreationDate: c.createdAt.toISOString(), TotalEnrollments: c._count.enrollments,
          AverageRating: ratings._avg.rating?.toFixed(2) || 'N/A',
        };
      }));
      data = processedCourses;
      break;
    }
    case "student_progress": {
      const enrollments = await db.enrollment.findMany({
        include: { user: { select: { id: true, name: true } }, learningPath: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const processedEnrollments = await Promise.all(enrollments.map(async e => {
        const progress = await getProgress(e.userId, e.learningPathId);
        return {
          UserID: e.user.id, UserName: e.user.name, CourseID: e.learningPath.id,
          CourseTitle: e.learningPath.title, EnrollmentDate: e.createdAt.toISOString(),
          ProgressPercentage: progress.toFixed(2),
        };
      }));
      data = processedEnrollments;
      break;
    }
    case "quiz_submissions": {
      const submissions = await db.quizSubmission.findMany({
        include: {
          user: { select: { id: true, name: true } },
          quiz: { include: { section: { include: { chapter: { include: { level: { include: { learningPath: { select: { id: true, title: true } } } } } } } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
      data = submissions.map(s => ({
        SubmissionID: s.id, UserID: s.user.id, UserName: s.user.name,
        QuizID: s.quiz.id, QuizTitle: s.quiz.title,
        CourseID: s.quiz.section?.chapter?.level?.learningPath?.id,
        CourseTitle: s.quiz.section?.chapter?.level?.learningPath?.title,
        Score: s.score?.toFixed(2) || 'Pending', Status: s.status,
        SubmissionDate: s.createdAt.toISOString(),
      }));
      break;
    }
    default:
      throw new Error("Invalid report type");
  }

  // اضافه کردن BOM برای پشتیبانی صحیح از کاراکترهای فارسی در Excel
  const BOM = "\uFEFF";
  return BOM + convertToCsv(data);
}