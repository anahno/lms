import { Level, Chapter, Section } from "@prisma/client";
import { CourseMobileSidebar } from "./CourseMobileSidebar";

// تعریف تایپ‌های جدید
type ChapterWithSections = Chapter & { sections: Section[] };
type LevelWithChapters = Level & { chapters: ChapterWithSections[] };
type LearningPathWithStructure = {
  id: string;
  title: string;
  levels: LevelWithChapters[];
};

interface CourseNavbarProps {
  learningPath: LearningPathWithStructure;
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
    </div>
  );
};