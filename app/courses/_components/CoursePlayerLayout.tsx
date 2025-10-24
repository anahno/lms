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
import type { BreadcrumbData } from "../[slug]/sections/[sectionSlug]/layout";
import { LoginOrPurchaseModal } from "./LoginOrPurchaseModal";

interface CoursePlayerLayoutProps {
  children: React.ReactNode;
  learningPath: LearningPathWithStructure & { price: number | null, discountPrice: number | null };
  progressCount: number;
  breadcrumbData: BreadcrumbData;
  isEnrolled: boolean;
}

export const CoursePlayerLayout = ({
  children,
  learningPath,
  progressCount,
  breadcrumbData,
  isEnrolled,
}: CoursePlayerLayoutProps) => {
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const finalPrice = learningPath.discountPrice ?? learningPath.price;

  return (
    <div className="h-full">
      <LoginOrPurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseId={learningPath.id}
        price={finalPrice}
      />

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
                isEnrolled={isEnrolled}
                onOpenModal={() => setIsModalOpen(true)}
              />
            </SheetContent>
          </Sheet>
        </CourseNavbar>
      </div>

      <div className="hidden md:block h-full fixed inset-y-0 right-0 z-40 pt-[80px]">
        {isDesktopSidebarOpen ? (
          // +++ اصلاح اصلی در این خط است +++
          // کلاس h-full اضافه شده تا ارتفاع 100% را بگیرد
          <div className="w-80 h-full"> 
            <CourseSidebar
              learningPath={learningPath}
              progressCount={progressCount}
              onClose={() => setDesktopSidebarOpen(false)}
              isEnrolled={isEnrolled}
              onOpenModal={() => setIsModalOpen(true)}
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