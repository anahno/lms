// فایل: app/courses/[learningPathId]/sections/[sectionId]/page.tsx
"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { CoursePlayerPage } from "../../../_components/CoursePlayerPage";

export default async function SectionIdPageWrapper({
  params,
}: {
  params: Promise<{ learningPathId: string; sectionId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirect("/login");
  }
  const userId = session.user.id;

  const resolvedParams = await params;
  const { learningPathId, sectionId } = resolvedParams;

  const [learningPath, section] = await Promise.all([
    db.learningPath.findUnique({
      where: {
        id: learningPathId,
        isPublished: true,
      },
      // --- شروع تغییر کلیدی ---
      // ما به Prisma صریحاً می‌گوییم که تمام فیلدهای مورد نیاز را انتخاب کند.
      select: {
        id: true,
        title: true,
        subtitle: true,
        description: true,
        whatYouWillLearn: true, // این فیلد حالا واکشی می‌شود
        requirements: true,     // این فیلد حالا واکشی می‌شود
        // هر فیلد دیگری که از learningPath نیاز دارید را اینجا اضافه کنید
      }
      // --- پایان تغییر کلیدی ---
    }),
    db.section.findUnique({
      where: {
        id: sectionId,
        isPublished: true,
      },
      include: {
        progress: {
          where: { userId },
        },
      },
    }),
  ]);

  if (!learningPath || !section) {
    return redirect("/");
  }

  const allSectionsInOrder = await db.section.findMany({
    where: {
      chapter: {
        level: { learningPathId: learningPathId },
        isPublished: true,
      },
      isPublished: true,
    },
    orderBy: [
      { chapter: { level: { position: "asc" } } },
      { chapter: { position: "asc" } },
      { position: "asc" },
    ],
    select: { id: true },
  });

  const currentSectionIndex = allSectionsInOrder.findIndex(s => s.id === sectionId);
  const nextSection = allSectionsInOrder[currentSectionIndex + 1];

  const isCompleted = !!section.progress && section.progress.length > 0 && section.progress[0].isCompleted;

  return (
    <CoursePlayerPage
      learningPath={learningPath}
      section={section}
      nextSectionId={nextSection?.id}
      isCompleted={isCompleted}
    />
  );
}