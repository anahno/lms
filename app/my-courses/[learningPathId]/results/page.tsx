// فایل: app/my-courses/[learningPathId]/results/page.tsx
"use server";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getCourseStats } from "@/actions/get-course-stats";
import { CourseGradesChart } from "@/components/CourseGradesChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, LineChart } from "lucide-react";
import { db } from "@/lib/db";

export default async function CourseResultsPage({
  params,
}: {
  // --- تغییر کلیدی ۱: تعریف params به عنوان یک Promise ---
  // این به Next.js اجازه می‌دهد تا رندرینگ را بهینه کند.
  params: Promise<{ learningPathId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirect("/login");
  }

  // --- تغییر کلیدی ۲: await کردن params قبل از استفاده ---
  // ما منتظر می‌مانیم تا پارامترهای داینامیک مسیر آماده شوند.
  const { learningPathId } = await params;

  // از اینجا به بعد، بقیه کد دقیقاً مثل قبل کار می‌کند
  // چون ما `learningPathId` را به صورت resolve شده در اختیار داریم.

  const course = await db.learningPath.findUnique({
    where: { id: learningPathId },
    select: { title: true }
  });

  if (!course) {
    return redirect("/my-courses");
  }

  const stats = await getCourseStats(session.user.id, learningPathId);

  if (!stats) {
    return (
      <div className="p-6 text-center">
        <p>اطلاعات این دوره یافت نشد یا مشکلی در بارگذاری آمار رخ داده است.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
        <Link
            href={`/my-courses`}
            className="flex items-center text-sm text-slate-600 hover:text-slate-800 transition mb-6"
        >
            <ArrowLeft className="h-4 w-4 ml-2" />
            بازگشت به لیست دوره‌های من
        </Link>

      <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">آمار و نمرات دوره</h1>
          <h2 className="text-xl text-muted-foreground">{course.title}</h2>
      </div>
      
      <Card className="bg-slate-100 border-2 border-slate-200">
        <CardHeader>
          <CardTitle className="text-center text-lg">میانگین کل نمرات شما در آزمون‌ها</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center gap-x-4">
          <LineChart className="h-16 w-16 text-sky-500" />
          <p className="text-6xl font-bold text-sky-600">
            {stats.overallAverage.toFixed(1)}
            <span className="text-3xl text-muted-foreground">%</span>
          </p>
        </CardContent>
      </Card>
      
      <div>
        <CourseGradesChart data={stats.chapterScores} />
      </div>
    </div>
  );
}