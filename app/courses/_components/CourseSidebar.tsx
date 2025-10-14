// فایل: app/courses/[learningPathId]/_components/CourseSidebar.tsx

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { CourseSidebarItem } from "./CourseSidebarItem";
import { Progress } from "@/components/ui/progress";
// --- ۱. تایپ‌ها از فایل متمرکز وارد می‌شوند ---
import { LearningPathWithStructure } from "@/lib/types";

interface CourseSidebarProps {
  learningPath: LearningPathWithStructure;
  progressCount: number;
}

export const CourseSidebar = async ({
  learningPath,
  progressCount,
}: CourseSidebarProps) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/");

  return (
    <div className="h-full border-l flex flex-col overflow-y-auto shadow-sm">
      <div className="p-8 flex flex-col border-b">
        <h1 className="font-semibold">{learningPath.title}</h1>
        <div className="mt-4">
          <Progress value={progressCount} className="h-2" />
          <p className="text-xs mt-2">{Math.round(progressCount)}% تکمیل شده</p>
        </div>
      </div>
      <div className="flex flex-col w-full">
        {learningPath.levels.map((level) => (
          <div key={level.id} className="mt-4">
            <h2 className="px-6 py-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">{level.title}</h2>
            {level.chapters.map((chapter) => (
              <div key={chapter.id} className="pl-4 border-l-2 border-slate-200 ml-4">
                <h3 className="px-4 py-2 text-sm font-medium text-slate-800">{chapter.title}</h3>
                {chapter.sections.map((section) => (
                  <CourseSidebarItem
                    key={section.id}
                    id={section.id}
                    label={section.title}
                    learningPathId={learningPath.id}
                    // --- ۲. این خط هم صحیح است و از "progress" استفاده می‌کند ---
                    isCompleted={!!section.progress[0]?.isCompleted}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};