// فایل: app/courses/[learningPathId]/sections/[sectionId]/page.tsx
"use server";

import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getProgress } from "@/actions/get-progress";

// این کامپوننت‌ها را در قدم بعدی خواهیم ساخت/منتقل کرد
import { CourseSidebar } from "./_components/CourseSidebar";
import { CourseNavbar } from "./_components/CourseNavbar";
import { CourseProgressButton } from "./_components/CourseProgressButton";

export default async function SectionIdPage({
  params,
}: {
  params: { learningPathId: string; sectionId: string };
}) {
  const { learningPathId, sectionId } = params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return redirect("/");
  }
  const userId = session.user.id;

  // ۱. --- Query جامع برای دریافت کل ساختار دوره و بخش فعلی ---
  const learningPath = await db.learningPath.findUnique({
    where: {
      id: learningPathId,
    },
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
              },
            },
          },
        },
      },
    },
  });

  if (!learningPath) {
    return redirect("/");
  }

  // پیدا کردن بخش فعلی از ساختار دریافت شده
  const currentSection = learningPath.levels
    .flatMap(level => level.chapters)
    .flatMap(chapter => chapter.sections)
    .find(section => section.id === sectionId);

  if (!currentSection) {
    return redirect("/");
  }

  const userTotalProgress = await getProgress(userId, learningPathId);

  const userProgressForThisSection = await db.userProgress.findUnique({
    where: {
      userId_sectionId: {
        userId,
        sectionId,
      },
    },
  });

  // پیدا کردن بخش بعدی برای دکمه "تکمیل و ادامه"
  const allSections = learningPath.levels
    .flatMap(level => level.chapters)
    .flatMap(chapter => chapter.sections);
    
  const currentSectionIndex = allSections.findIndex(s => s.id === sectionId);
  const nextSection = allSections[currentSectionIndex + 1];

  return (
    <div className="h-full">
      <div className="h-[80px] fixed inset-y-0 w-full z-50">
        <CourseNavbar
          learningPath={learningPath} // پاس دادن کل ساختار
          userProgressCount={userTotalProgress}
        />
      </div>

      <div className="hidden md:flex h-full w-80 flex-col fixed inset-y-0 z-50 pt-[80px]">
        <CourseSidebar
          learningPath={learningPath} // پاس دادن کل ساختار
          userProgressCount={userTotalProgress}
        />
      </div>

      <main className="md:pr-80 pt-[80px] h-full">
        <div className="p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-semibold mb-4">{currentSection.title}</h1>
          
          {currentSection.videoUrl && (
            <div className="relative aspect-video">
              <video
                src={currentSection.videoUrl}
                controls
                className="w-full h-full rounded-md"
              />
            </div>
          )}
          
          <div
            className="mt-8 prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: currentSection.description || "" }}
          />

          <hr className="my-8" />
          <CourseProgressButton
            sectionId={sectionId}
            learningPathId={learningPathId}
            nextSectionId={nextSection?.id}
            isCompleted={!!userProgressForThisSection?.isCompleted}
          />
        </div>
      </main>
    </div>
  );
}