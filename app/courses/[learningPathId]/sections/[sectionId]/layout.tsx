// فایل: app/courses/[learningPathId]/sections/[sectionId]/layout.tsx
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getProgress } from "@/actions/get-progress";
import { CoursePlayerLayout } from "../../../_components/CoursePlayerLayout"; // کامپوننت لایه‌بندی کلاینت

// --- شروع اصلاحات کلیدی ---
export default async function CourseSectionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // این تایپ باید شامل تمام پارامترهای مسیر تا این نقطه باشد.
  // چون این layout داخل پوشه [sectionId] است، پس هم learningPathId و هم sectionId را دارد.
  params: Promise<{ learningPathId: string; sectionId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/");

  // Promise را باز می‌کنیم تا به مقادیر دسترسی پیدا کنیم
  const resolvedParams = await params;
  const { learningPathId } = resolvedParams;

  // واکشی داده‌ها در Server Component
  const learningPath = await db.learningPath.findUnique({
    where: { id: learningPathId },
    include: {
      levels: {
        orderBy: { position: "asc" },
        include: {
          chapters: {
            where: { isPublished: true },
            orderBy: { position: "asc" },
            include: {
              sections: {
                where: { isPublished: true },
                orderBy: { position: "asc" },
                include: {
                  progress: { where: { userId: session.user.id } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!learningPath) return redirect("/");

  const progressCount = await getProgress(session.user.id, learningPath.id);

  // ارسال داده‌های آماده به کامپوننت کلاینت برای مدیریت UI
  return (
    <CoursePlayerLayout
      learningPath={learningPath}
      progressCount={progressCount}
    >
      {children}
    </CoursePlayerLayout>
  );
}
// --- پایان اصلاحات ---