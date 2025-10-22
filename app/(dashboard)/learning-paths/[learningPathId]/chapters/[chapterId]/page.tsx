// فایل: app/(dashboard)/learning-paths/[learningPathId]/chapters/[chapterId]/page.tsx
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ChapterPageClient } from "./_components/ChapterPageClient"; // کامپوننت کلاینت را وارد می‌کنیم

export default async function ChapterIdPage({
  params,
}: {
  params: Promise<{ learningPathId: string; chapterId: string }>;
}) {
  const { learningPathId, chapterId } = await params;

  // منطق واکشی داده بدون تغییر باقی می‌ماند
  const chapter = await db.chapter.findUnique({
    where: {
      id: chapterId,
      level: { learningPathId: learningPathId },
    },
    include: {
      sections: {
        orderBy: { position: "asc" },
        include: {
          progress: {
            select: {
              rating: true,
            },
          },
        },
      },
      level: {
        include: {
          learningPath: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  if (!chapter || !chapter.level.learningPath) {
    return redirect("/");
  }

  // داده‌های مورد نیاز را پردازش می‌کنیم
  const allRatings = chapter.sections.flatMap(section => section.progress.map(p => p.rating));

  // کامپوننت کلاینت را با تمام پراپ‌های لازم رندر می‌کنیم
  return (
    <ChapterPageClient
      chapter={chapter}
      learningPathId={learningPathId}
      chapterId={chapterId}
      allRatings={allRatings}
    />
  );
}