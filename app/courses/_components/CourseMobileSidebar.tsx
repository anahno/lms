// فایل: app/courses/_components/CourseMobileSidebar.tsx
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CourseSidebar } from "./CourseSidebar";
import { LearningPathWithStructure } from "@/lib/types";

// +++ ۱. پراپ onOpenModal را به اینترفیس اضافه کنید +++
interface CourseMobileSidebarProps {
  learningPath: LearningPathWithStructure;
  progressCount: number;
  isEnrolled: boolean;
  onOpenModal: () => void; // <--- این خط اضافه شد
}

export const CourseMobileSidebar = ({
  learningPath,
  progressCount,
  isEnrolled,
  onOpenModal, // <--- ۲. پراپ را اینجا دریافت کنید
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
          isEnrolled={isEnrolled}
          onOpenModal={onOpenModal} // <--- ۳. پراپ را به کامپوننت فرزند پاس دهید
          onClose={() => {}} // onClose اختیاری است اما بهتر است یک تابع خالی به آن بدهیم
        />
      </SheetContent>
    </Sheet>
  );
};