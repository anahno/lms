// فایل: app/courses/_components/CourseSidebar.tsx
"use client";

import { useState } from "react";
import { CourseSidebarItem } from "./CourseSidebarItem";
import { Progress } from "@/components/ui/progress";
import type { LearningPathWithStructure } from "@/lib/types";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseSidebarProps {
  learningPath: LearningPathWithStructure;
  progressCount: number;
  onClose?: () => void;
}

const formatDuration = (totalSeconds: number | null) => {
    if (totalSeconds === null || isNaN(totalSeconds)) return "N/A";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    let result = "";
    if (hours > 0) result += `${hours} ساعت `;
    if (minutes > 0) result += `${minutes} دقیقه`;
    return result.trim() || "کمتر از ۱ دقیقه";
};

export const CourseSidebar = ({ learningPath, progressCount, onClose }: CourseSidebarProps) => {
  const [expandedChapters, setExpandedChapters] = useState<string[]>(
    [learningPath.levels[0]?.chapters[0]?.id].filter(Boolean)
  );

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  return (
    <div className="h-full border-l flex flex-col bg-white shadow-lg">
      <div className="p-4 flex items-center justify-between border-b">
        <h2 className="text-lg font-bold">محتوای دوره</h2>
        {/* --- دکمه بستن جدید --- */}
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded-md md:block hidden" // فقط در دسکتاپ نمایش داده می‌شود
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 flex flex-col border-b">
        <div className="mt-2">
          <Progress value={progressCount} className="h-2" />
          <p className="text-xs mt-2 text-slate-600">
            {Math.round(progressCount)}% تکمیل شده
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {learningPath.levels.map((level) => (
          <div key={level.id} className="pt-2">
            {level.chapters.map((chapter) => {
              const totalSections = chapter.sections.length;
              const completedSections = chapter.sections.filter(
                (s) => s.progress?.[0]?.isCompleted
              ).length;
              const totalDuration = chapter.sections.reduce(
                (acc, sec) => acc + (sec.duration || 0),
                0
              );
              const isExpanded = expandedChapters.includes(chapter.id);

              return (
                <div key={chapter.id} className="border-b">
                  <button
                    onClick={() => toggleChapter(chapter.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 text-right"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 text-sm mb-1">
                        {chapter.title}
                      </h3>
                      <div className="text-xs text-slate-600">
                        {completedSections} / {totalSections} |{" "}
                        {formatDuration(totalDuration)}
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </button>
                  {isExpanded && (
                    <div className="bg-white border-t">
                      {chapter.sections.map((section) => (
                        <CourseSidebarItem
                          key={section.id}
                          id={section.id}
                          label={section.title}
                          duration={section.duration}
                          learningPathId={learningPath.id}
                          isCompleted={!!section.progress?.[0]?.isCompleted}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};