// فایل: app/(dashboard)/grading/page.tsx
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SubmissionStatus, Role } from "@prisma/client";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge"; // این import استفاده نشده و حذف می‌شود
import { Button } from "@/components/ui/button";

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export default async function GradingCenterPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirect("/login");
  }

  // --- شروع تغییر کلیدی ---
  // استفاده از روش امن برای دسترسی به نقش کاربر
  const userRole = (session.user as unknown as { role: Role }).role;
  // --- پایان تغییر کلیدی ---
  const userId = session.user.id;

  const submissionsToGrade = await db.quizSubmission.findMany({
    where: {
      status: SubmissionStatus.SUBMITTED,
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
          section: {
            include: {
              chapter: {
                include: {
                  level: {
                    include: {
                      learningPath: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">مرکز نمره‌دهی</h1>
      
      {submissionsToGrade.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <p>هیچ آزمونی برای تصحیح وجود ندارد.</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>دانشجو</TableHead>
                <TableHead>نام آزمون</TableHead>
                <TableHead>دوره</TableHead>
                <TableHead>تاریخ ثبت</TableHead>
                <TableHead className="text-left">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissionsToGrade.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">
                    {submission.user.name || submission.user.email}
                  </TableCell>
                  <TableCell>{submission.quiz.title}</TableCell>
                  <TableCell>
                    {submission.quiz.section?.chapter.level.learningPath.title}
                  </TableCell>
                  <TableCell>{formatDate(submission.createdAt)}</TableCell>
                  <TableCell className="text-left">
                    <Link href={`/grading/${submission.id}`}>
                        <Button variant="outline" size="sm">
                            مشاهده و نمره‌دهی
                        </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}