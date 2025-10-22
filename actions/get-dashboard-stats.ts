// فایل: actions/get-dashboard-stats.ts
"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// نوع داده برای نمودار جدید
export type CoursesByCategory = {
  category: string;
  _count: {
    learningPaths: number;
  };
};

// نوع خروجی اصلی
export type DashboardStats = {
  totalUsers: number;
  activeUsersLastWeek: number;
  engagementRate: number;
  totalCourses: number;
  publishedCourses: number;
  unansweredQuestions: number;
  coursesByCategory: CoursesByCategory[]; // داده‌های نمودار جدید
};

export const getDashboardStats = async (
  adminId: string,
  isAdmin: boolean
): Promise<DashboardStats> => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const courseWhereClause: Prisma.LearningPathWhereInput = isAdmin ? {} : { userId: adminId };

    const [
      totalUsers,
      activeUserProgress,
      totalCourses,
      publishedCourses,
      unansweredQuestionsData,
      // +++ واکشی داده‌های جدید برای نمودار +++
      coursesByCategory,
    ] = await Promise.all([
      db.user.count({ where: { role: 'USER' } }),
      db.userProgress.findMany({
        where: { updatedAt: { gte: oneWeekAgo } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      db.learningPath.count({ where: courseWhereClause }),
      db.learningPath.count({ where: { ...courseWhereClause, status: 'PUBLISHED' } }),
      db.discussion.findMany({
          where: { parentId: null, section: { chapter: { level: { learningPath: courseWhereClause } } } },
          include: { replies: { include: { user: { select: { role: true }} } } }
      }),
      // کوئری برای شمارش دوره‌ها در هر دسته‌بندی
      db.category.findMany({
          where: {
              learningPaths: {
                  some: courseWhereClause
              }
          },
          select: {
              name: true,
              _count: {
                  select: {
                      learningPaths: { where: courseWhereClause }
                  }
              }
          },
          orderBy: {
              learningPaths: {
                  _count: 'desc'
              }
          }
      })
    ]);
    
    const activeUsersLastWeek = activeUserProgress.length;
    const engagementRate = totalUsers > 0 ? (activeUsersLastWeek / totalUsers) * 100 : 0;
    const unansweredQuestions = unansweredQuestionsData.filter(q => 
        !q.replies.some(r => r.user.role === 'INSTRUCTOR' || r.user.role === 'ADMIN')
    ).length;

    // تبدیل نام به "category" برای هماهنگی با نوع داده
    const formattedCoursesByCategory = coursesByCategory.map(cat => ({
        category: cat.name,
        _count: cat._count
    }));

    return {
      totalUsers,
      activeUsersLastWeek,
      engagementRate,
      totalCourses,
      publishedCourses,
      unansweredQuestions,
      coursesByCategory: formattedCoursesByCategory,
    };

  } catch (error) {
    console.error("[GET_DASHBOARD_STATS_ERROR]", error);
    // بازگرداندن مقادیر پیش‌فرض در صورت خطا
    return {
      totalUsers: 0,
      activeUsersLastWeek: 0,
      engagementRate: 0,
      totalCourses: 0,
      publishedCourses: 0,
      unansweredQuestions: 0,
      coursesByCategory: [],
    };
  }
};