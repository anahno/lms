// فایل: app/courses/_components/CourseNavbar.tsx

import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LearningPathWithStructure } from "@/lib/types";
import { CourseSidebar } from "./CourseSidebar"; // ما به این کامپوننت در اینجا نیاز داریم

interface CourseNavbarProps {
  learningPath: LearningPathWithStructure;
  progressCount: number;
}

export const CourseNavbar = ({
  learningPath,
  progressCount,
}: CourseNavbarProps) => {
  return (
    <div className="p-4 border-b h-full flex items-center bg-white shadow-sm">
      {/* منوی همبرگری برای موبایل که سایدبار را در یک Sheet باز می‌کند */}
      <Sheet>
        <SheetTrigger className="md:hidden pr-4 hover:opacity-75 transition">
          <Menu />
        </SheetTrigger>
        <SheetContent side="right" className="p-0 bg-white w-72">
          {/* سایدبار فقط برای حالت موبایل در اینجا رندر می‌شود */}
          <CourseSidebar
            learningPath={learningPath}
            progressCount={progressCount}
          />
        </SheetContent>
      </Sheet>

      {/* عنوان دوره */}
      <h1 className="font-semibold text-lg">{learningPath.title}</h1>
    </div>
  );
};