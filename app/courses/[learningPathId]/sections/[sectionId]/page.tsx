// فایل: app/courses/[learningPathId]/sections/[sectionId]/page.tsx
"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { CoursePlayerPage } from "@/app/courses/_components/CoursePlayerPage";
import { CourseStatus } from "@prisma/client"; // ۱. ایمپورت کردن enum برای type safety

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
    db.learningPath.findFirst({
      // --- شروع تغییر نهایی و قطعی ---
      // به جای isPublished، از status: 'PUBLISHED' استفاده می‌کنیم
      where: {
        id: learningPathId,
        status: CourseStatus.PUBLISHED, // <-- استفاده از enum صحیح
      },
      // --- پایان تغییر نهایی و قطعی ---
      select: {
        id: true,
        title: true,
        subtitle: true,
        description: true,
        whatYouWillLearn: true,
        requirements: true,
      },
    }),
    // کوئری برای Section صحیح است چون Section هنوز isPublished دارد
    db.section.findFirst({
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

  // ... بقیه کد بدون تغییر ...
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