// فایل: app/courses/_components/CourseMobileSidebar.tsx
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CourseSidebar } from "./CourseSidebar";
import { LearningPathWithStructure } from "@/lib/types";

// +++ ۱. پراپ جدید را به اینترفیس اضافه کنید +++
interface CourseMobileSidebarProps {
  learningPath: LearningPathWithStructure;
  progressCount: number;
  isEnrolled: boolean;
}

export const CourseMobileSidebar = ({
  learningPath,
  progressCount,
  isEnrolled, // +++ ۲. پراپ را اینجا دریافت کنید +++
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
          isEnrolled={isEnrolled} // +++ ۳. پراپ را به کامپوننت فرزند پاس دهید +++
        />
      </SheetContent>
    </Sheet>
  );
};