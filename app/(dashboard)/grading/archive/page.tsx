// فایل: app/(dashboard)/grading/archive/page.tsx
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
import { Button } from "@/components/ui/button";

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export default async function GradingArchivePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirect("/login");
  }

  const userRole = (session.user as unknown as { role: Role }).role;
  const userId = session.user.id;

  const gradedSubmissions = await db.quizSubmission.findMany({
    where: {
      // --- تغییر کلیدی: به جای SUBMITTED، وضعیت GRADED را فیلتر می‌کنیم ---
      status: SubmissionStatus.GRADED,
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
      updatedAt: "desc", // بر اساس آخرین تاریخ به‌روزرسانی مرتب می‌کنیم
    },
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">آرشیو نمرات تصحیح شده</h1>
      
      {gradedSubmissions.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <p>هیچ آزمون تصحیح شده‌ای در آرشیو یافت نشد.</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>دانشجو</TableHead>
                <TableHead>نام آزمون</TableHead>
                <TableHead>دوره</TableHead>
                <TableHead>نمره نهایی</TableHead>
                <TableHead>تاریخ تصحیح</TableHead>
                <TableHead className="text-left">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gradedSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">
                    {submission.user.name || submission.user.email}
                  </TableCell>
                  <TableCell>{submission.quiz.title}</TableCell>
                  <TableCell>
                    {submission.quiz.section?.chapter.level.learningPath.title}
                  </TableCell>
                  <TableCell className="font-bold">
                    {submission.score?.toFixed(1) ?? "-"}%
                  </TableCell>
                  <TableCell>{formatDate(submission.updatedAt)}</TableCell>
                  <TableCell className="text-left">
                    <Link href={`/grading/${submission.id}`}>
                        <Button variant="outline" size="sm">
                            مشاهده و ویرایش نمره
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