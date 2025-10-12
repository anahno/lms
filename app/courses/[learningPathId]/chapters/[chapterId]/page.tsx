// فایل: app/courses/[learningPathId]/chapters/[chapterId]/page.tsx

import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getProgress } from "@/actions/get-progress";

import { CourseSidebar } from "./_components/CourseSidebar";
import { CourseNavbar } from "./_components/CourseNavbar";
import { CourseProgressButton } from "./_components/CourseProgressButton";

// --- تغییر کلیدی: استفاده از async function declaration ---
export default async function ChapterIdPage({
  params,
}: {
  params: Promise<{ learningPathId: string; chapterId: string }>;
}) {
  const { learningPathId, chapterId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return redirect("/");
  }
  const userId = session.user.id;

  const learningPath = await db.learningPath.findUnique({
    where: {
      id: learningPathId,
    },
    include: {
      chapters: {
        where: {
          isPublished: true,
        },
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!learningPath) {
    return redirect("/");
  }

  const chapter = learningPath.chapters.find((c) => c.id === chapterId);
  if (!chapter) {
    return redirect("/");
  }

  const userTotalProgress = await getProgress(userId, learningPathId);

  const userProgressForThisChapter = await db.userProgress.findUnique({
    where: {
      userId_chapterId: {
        userId,
        chapterId,
      },
    },
  });

  const currentChapterIndex = learningPath.chapters.findIndex((c) => c.id === chapterId);
  const nextChapter = learningPath.chapters[currentChapterIndex + 1];

  return (
    <div className="h-full">
      <div className="h-[80px] fixed inset-y-0 w-full z-50">
        <CourseNavbar
          learningPath={learningPath}
          userProgressCount={userTotalProgress}
        />
      </div>

      <div className="hidden md:flex h-full w-80 flex-col fixed inset-y-0 z-50 pt-[80px]">
        <CourseSidebar
          learningPath={learningPath}
          userProgressCount={userTotalProgress}
        />
      </div>

      <main className="md:pr-80 pt-[80px] h-full">
        <div className="p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-semibold mb-4">{chapter.title}</h1>
          
          {chapter.videoUrl && (
            <div className="relative aspect-video">
              <video
                src={chapter.videoUrl}
                controls
                className="w-full h-full rounded-md"
              />
            </div>
          )}
          
          <div
            className="mt-8 prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: chapter.description || "" }}
          />

          <hr className="my-8" />
          <CourseProgressButton
            chapterId={chapterId}
            learningPathId={learningPathId}
            nextChapterId={nextChapter?.id}
            isCompleted={!!userProgressForThisChapter?.isCompleted}
          />
        </div>
      </main>
    </div>
  );
}