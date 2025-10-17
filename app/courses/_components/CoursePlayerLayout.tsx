// فایل: app/courses/_components/CoursePlayerLayout.tsx
"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CourseSidebar } from "../_components/CourseSidebar";
import { CourseNavbar } from "../_components/CourseNavbar";
import { CollapsedSidebar } from "../_components/CollapsedSidebar"; // کامپوننت جدید
import type { LearningPathWithStructure } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

interface CoursePlayerLayoutProps {
  children: React.ReactNode;
  learningPath: LearningPathWithStructure;
  progressCount: number;
}

export const CoursePlayerLayout = ({
  children,
  learningPath,
  progressCount,
}: CoursePlayerLayoutProps) => {
  // این state وضعیت باز/بسته بودن سایدبار دسکتاپ را کنترل می‌کند
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  return (
    <div className="h-full">
      {/* Navbar اصلی */}
      <div className="h-[80px] fixed inset-y-0 w-full z-50">
        <CourseNavbar
          learningPath={learningPath}
          progressCount={progressCount}
        >
          {/* دکمه منوی همبرگری موبایل در اینجا قرار می‌گیرد */}
          <Sheet>
            <SheetTrigger className="md:hidden pr-4 hover:opacity-75 transition">
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="p-0 bg-white w-80">
              {/* سایدبار کامل فقط برای موبایل در Sheet رندر می‌شود */}
              <CourseSidebar
                learningPath={learningPath}
                progressCount={progressCount}
                onClose={() => {}} // در موبایل نیازی به این نیست
              />
            </SheetContent>
          </Sheet>
        </CourseNavbar>
      </div>

      {/* بخش سایدبار دسکتاپ */}
      <div className="hidden md:block h-full fixed inset-y-0 right-0 z-40 pt-[80px]">
        {isDesktopSidebarOpen ? (
          <div className="w-80">
            <CourseSidebar
              learningPath={learningPath}
              progressCount={progressCount}
              onClose={() => setDesktopSidebarOpen(false)}
            />
          </div>
        ) : (
          <CollapsedSidebar onOpen={() => setDesktopSidebarOpen(true)} />
        )}
      </div>

      {/* محتوای اصلی صفحه */}
      <main
        className={cn(
          "pt-[80px] h-full transition-all duration-300",
          // بر اساس وضعیت سایدبار دسکتاپ، padding سمت راست را تنظیم می‌کنیم
          isDesktopSidebarOpen ? "md:pr-80" : "md:pr-20"
        )}
      >
        {children}
      </main>
    </div>
  );
};