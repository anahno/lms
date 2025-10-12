
// فایل: .../chapters/[chapterId]/_components/CourseSidebar.tsx
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Chapter, LearningPath } from "@prisma/client";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { CourseSidebarItem } from "./CourseSidebarItem";
import { Progress } from "@/components/ui/progress";

interface CourseSidebarProps {
  learningPath: LearningPath & {
    chapters: Chapter[];
  };
  userProgressCount: number;
}

export const CourseSidebar = async ({
  learningPath,
  userProgressCount,
}: CourseSidebarProps) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/");

  // دریافت پیشرفت کاربر برای هر فصل
  const userProgress = await db.userProgress.findMany({
    where: {
      userId: session.user.id,
      chapterId: {
        in: learningPath.chapters.map(c => c.id),
      },
    },
  });

  return (
    <div className="h-full border-l flex flex-col overflow-y-auto shadow-sm">
      <div className="p-8 flex flex-col border-b">
        <h1 className="font-semibold">{learningPath.title}</h1>
        <div className="mt-4">
          <Progress value={userProgressCount} className="h-2" />
          <p className="text-xs mt-2">{Math.round(userProgressCount)}% تکمیل شده</p>
        </div>
      </div>
      <div className="flex flex-col w-full">
        {learningPath.chapters.map((chapter) => (
          <CourseSidebarItem
            key={chapter.id}
            id={chapter.id}
            label={chapter.title}
            learningPathId={learningPath.id}
            isCompleted={!!userProgress.find(p => p.chapterId === chapter.id && p.isCompleted)}
          />
        ))}
      </div>
    </div>
  );
};