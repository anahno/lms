// فایل: .../chapters/[chapterId]/_components/CourseMobileSidebar.tsx
import { Menu } from "lucide-react";
import { Chapter, LearningPath } from "@prisma/client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CourseSidebar } from "./CourseSidebar";

interface CourseMobileSidebarProps {
  learningPath: LearningPath & {
    chapters: Chapter[];
  };
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