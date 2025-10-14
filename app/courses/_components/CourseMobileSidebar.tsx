// فایل: app/courses/[learningPathId]/_components/CourseMobileSidebar.tsx
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CourseSidebar } from "./CourseSidebar";
import { LearningPathWithStructure } from "@/lib/types";

interface CourseMobileSidebarProps {
  learningPath: LearningPathWithStructure;
  progressCount: number;
}

export const CourseMobileSidebar = ({
  learningPath,
  progressCount,
}: CourseMobileSidebarProps) => {
  return (
    <Sheet>
      <SheetTrigger className="md:hidden pr-4 hover:opacity-75 transition">
        <Menu />
      </SheetTrigger>
      <SheetContent side="right" className="p-0 bg-white w-72">
        <CourseSidebar
          learningPath={learningPath}
          progressCount={progressCount}
        />
      </SheetContent>
    </Sheet>
  );
};