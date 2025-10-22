// فایل: app/(dashboard)/learning-paths/[learningPathId]/edit/page.tsx
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";
import { EditPageClient } from "./_components/EditPageClient";

export default async function EditLearningPathPage({
  params,
}: {
  params: Promise<{ learningPathId: string }>; 
}) {
  const { learningPathId } = await params;

  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return redirect("/login");
  }

  const userId = session.user.id;
  const userRole = (session.user as unknown as { role: Role }).role;

  if (!userRole) {
      return redirect("/login");
  }

  const [learningPath, categories] = await Promise.all([
    db.learningPath.findUnique({
      where: {
        id: learningPathId,
      },
      // +++ شروع تغییر اصلی: واکشی عمیق امتیازات +++
      include: {
        levels: {
          orderBy: { position: "asc" },
          include: {
            chapters: {
              orderBy: { position: "asc" },
              include: {
                sections: {
                  include: {
                    progress: {
                      select: { rating: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      // +++ پایان تغییر اصلی +++
    }),
    db.category.findMany({
      where: { parentId: null },
      include: {
        subcategories: { orderBy: { name: "asc" } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!learningPath) {
    return redirect("/");
  }

  if (userRole === "INSTRUCTOR" && learningPath.userId !== userId) {
    return redirect("/");
  }

  // ... (بقیه منطق محاسبه فیلدهای تکمیل شده بدون تغییر)
  const hasPublishedChapter = learningPath.levels.some(level => 
    level.chapters.some(chapter => chapter.isPublished)
  );

  const requiredFields = [
    learningPath.title,
    learningPath.description,
    learningPath.imageUrl,
    learningPath.categoryId,
    hasPublishedChapter,
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const isComplete = requiredFields.every(Boolean);

  // +++ استخراج تمام امتیازات دوره +++
  const allRatings = learningPath.levels.flatMap(level => 
    level.chapters.flatMap(chapter => 
      chapter.sections.flatMap(section => 
        section.progress.map(p => p.rating)
      )
    )
  );
  
  return (
    <EditPageClient
      learningPath={learningPath}
      categories={categories}
      completedFields={completedFields}
      totalFields={totalFields}
      isComplete={isComplete}
      userRole={userRole}
      allRatings={allRatings} // +++ پاس دادن امتیازات به کامپوننت کلاینت +++
    />
  );
}