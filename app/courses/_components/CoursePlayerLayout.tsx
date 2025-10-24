// فایل: app/courses/_components/CoursePlayerLayout.tsx
"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CourseSidebar } from "../_components/CourseSidebar";
import { CourseNavbar } from "../_components/CourseNavbar";
import { CollapsedSidebar } from "../_components/CollapsedSidebar";
import type { LearningPathWithStructure } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import type { BreadcrumbData } from "../[learningPathId]/sections/[sectionId]/layout";


interface CoursePlayerLayoutProps {
  children: React.ReactNode;
  learningPath: LearningPathWithStructure;
  progressCount: number;
  breadcrumbData: BreadcrumbData;
  isEnrolled: boolean; // +++ ۱. پراپ جدید +++
}

export const CoursePlayerLayout = ({
  children,
  learningPath,
  progressCount,
  breadcrumbData,
  isEnrolled, // +++ ۲. دریافت پراپ +++
}: CoursePlayerLayoutProps) => {
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  return (
    <div className="h-full">
      <div className="h-[80px] fixed inset-y-0 w-full z-50">
        <CourseNavbar
          learningPath={learningPath}
          progressCount={progressCount}
          breadcrumbData={breadcrumbData}
        >
          <Sheet>
            <SheetTrigger className="md:hidden pr-4 hover:opacity-75 transition">
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="p-0 bg-white w-80">
              <CourseSidebar
                learningPath={learningPath}
                progressCount={progressCount}
                onClose={() => {}}
                isEnrolled={isEnrolled} // +++ ۳. پاس دادن به سایدبار +++
              />
            </SheetContent>
          </Sheet>
        </CourseNavbar>
      </div>

      <div className="hidden md:block h-full fixed inset-y-0 right-0 z-40 pt-[80px]">
        {isDesktopSidebarOpen ? (
          <div className="w-80">
            <CourseSidebar
              learningPath={learningPath}
              progressCount={progressCount}
              onClose={() => setDesktopSidebarOpen(false)}
              isEnrolled={isEnrolled} // +++ ۴. پاس دادن به سایدبار +++
            />
          </div>
        ) : (
          <CollapsedSidebar onOpen={() => setDesktopSidebarOpen(true)} />
        )}
      </div>

      <main
        className={cn(
          "pt-[80px] h-full transition-all duration-300",
          isDesktopSidebarOpen ? "md:pr-80" : "md:pr-20"
        )}
      >
        {children}
      </main>
    </div>
  );
};