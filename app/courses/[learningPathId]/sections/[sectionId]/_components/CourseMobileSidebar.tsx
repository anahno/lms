import { Menu } from "lucide-react";
import { Level, Chapter, Section } from "@prisma/client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CourseSidebar } from "./CourseSidebar";

// تعریف تایپ‌های جدید
type ChapterWithSections = Chapter & { sections: Section[] };
type LevelWithChapters = Level & { chapters: ChapterWithSections[] };
type LearningPathWithStructure = {
  id: string;
  title: string;
  levels: LevelWithChapters[];
};

interface CourseMobileSidebarProps {
  learningPath: LearningPathWithStructure;
  userProgressCount: number;
}

export const CourseMobileSidebar = ({
  learningPath,
  userProgressCount,
}: CourseMobileSidebarProps) => {
  return (
    <Sheet>
      <SheetTrigger className="md:hidden pr-4 hover:opacity-75 transition">
        <Menu />
      </SheetTrigger>
      <SheetContent side="right" className="p-0 bg-white w-72">
        <CourseSidebar
          learningPath={learningPath}
          userProgressCount={userProgressCount}
        />
      </SheetContent>
    </Sheet>
  );
};