// فایل: .../chapters/[chapterId]/_components/CourseNavbar.tsx
import { Chapter, LearningPath } from "@prisma/client";
import { CourseMobileSidebar } from "./CourseMobileSidebar";

interface CourseNavbarProps {
  learningPath: LearningPath & {
    chapters: Chapter[];
  };
  userProgressCount: number;
}

export const CourseNavbar = ({
  learningPath,
  userProgressCount,
}: CourseNavbarProps) => {
  return (
    <div className="p-4 border-b h-full flex items-center bg-white shadow-sm">
      <CourseMobileSidebar
        learningPath={learningPath}
        userProgressCount={userProgressCount}
      />
      <h1 className="font-semibold text-lg">{learningPath.title}</h1>
      {/* در آینده می‌توانید دکمه‌های دیگری اینجا اضافه کنید */}
    </div>
  );
};