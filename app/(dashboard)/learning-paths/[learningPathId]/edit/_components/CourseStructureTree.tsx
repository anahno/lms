"use client";

import Link from "next/link";
import { Prisma } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Layers, FolderOpen, FileText, Circle } from "lucide-react";

type LearningPathWithFullStructure = Prisma.LearningPathGetPayload<{
  include: {
    levels: {
      include: {
        chapters: {
          include: {
            sections: true;
          }
        }
      }
    }
  }
}>;

interface CourseStructureTreeProps {
  learningPath: LearningPathWithFullStructure;
}

export const CourseStructureTree = ({ learningPath }: CourseStructureTreeProps) => {
  return (
    <div className="w-full max-w-5xl mx-auto p-4" dir="rtl">
      {/* هدر اصلی دوره */}
      <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-6 mb-8 shadow-lg">
        <div className="flex items-center gap-x-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <Layers className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
              {learningPath.title}
            </h2>
            <p className="text-sm text-sky-100">
              {learningPath.levels.length} سطح • {learningPath.levels.reduce((acc, level) => acc + level.chapters.length, 0)} فصل
            </p>
          </div>
        </div>
      </div>

      {/* ساختار درختی */}
      <div className="space-y-8">
        {learningPath.levels.map((level, levelIndex) => (
          <div key={level.id} className="relative">
            {/* خط عمودی برای اتصال سطوح */}
            {levelIndex < learningPath.levels.length - 1 && (
              <div className="absolute right-6 top-20 bottom-0 w-0.5 bg-gradient-to-b from-amber-300 to-transparent" />
            )}

            {/* کارت سطح */}
            <div className="bg-white rounded-2xl shadow-md border-2 border-amber-200 overflow-hidden">
              {/* هدر سطح */}
              <div className="bg-gradient-to-l from-amber-400 to-orange-400 p-5">
                <div className="flex items-center gap-x-4">
                  <div className="p-3 bg-white rounded-xl shadow-md">
                    <FolderOpen className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg md:text-xl">
                      {level.title}
                    </h3>
                    <p className="text-xs text-amber-50 mt-1">
                      {level.chapters.length} فصل در این سطح
                    </p>
                  </div>
                </div>
              </div>

              {/* فصل‌ها */}
              <div className="p-6">
                <div className="space-y-6">
                  {level.chapters.map((chapter, chapterIndex) => (
                    <div key={chapter.id} className="relative">
                      {/* خط عمودی برای اتصال فصل‌ها */}
                      {chapterIndex < level.chapters.length - 1 && chapter.sections.length > 0 && (
                        <div className="absolute right-5 top-14 bottom-0 w-0.5 bg-slate-200" />
                      )}

                      {/* کارت فصل */}
                      <div className="bg-slate-50 rounded-xl border-2 border-slate-200 overflow-hidden hover:border-slate-300 transition-all duration-200">
                        <Link 
                          href={`/learning-paths/${learningPath.id}/chapters/${chapter.id}`}
                          className="block"
                        >
                          <div className="p-4 bg-gradient-to-l from-slate-100 to-slate-50 hover:from-slate-200 hover:to-slate-100 transition-colors">
                            <div className="flex items-center gap-x-3">
                              <div className="p-2.5 bg-white rounded-lg shadow-sm border border-slate-200">
                                <FileText className="h-5 w-5 text-slate-600" />
                              </div>
                              <span className="flex-1 font-semibold text-slate-800 text-base md:text-lg">
                                {chapter.title}
                              </span>
                              <Badge 
                                variant={chapter.isPublished ? "success" : "secondary"}
                                className="text-xs px-3 py-1"
                              >
                                {chapter.isPublished ? "منتشر شده" : "پیش‌نویس"}
                              </Badge>
                            </div>
                          </div>
                        </Link>

                        {/* بخش‌ها */}
                        {chapter.sections.length > 0 && (
                          <div className="px-4 pb-4 pt-2 bg-white">
                            <div className="mr-10 space-y-2 border-r-2 border-dashed border-slate-300 pr-4">
                              {chapter.sections.map((section, sectionIndex) => (
                                <div key={section.id} className="relative">
                                  {/* خط افقی اتصال */}
                                  <div className="absolute -right-4 top-1/2 w-4 h-0.5 border-t-2 border-dashed border-slate-300" />
                                  
                                  <Link
                                    href={`/learning-paths/${learningPath.id}/chapters/${chapter.id}/sections/${section.id}`}
                                    className="flex items-center gap-x-3 p-3 rounded-lg bg-slate-50 hover:bg-sky-50 hover:shadow-sm border border-transparent hover:border-sky-200 transition-all duration-150 group"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Circle className="h-2 w-2 fill-slate-400 text-slate-400 group-hover:fill-sky-500 group-hover:text-sky-500 transition-colors flex-shrink-0" />
                                    <span className="text-sm text-slate-700 group-hover:text-slate-900 flex-1 min-w-0 truncate font-medium">
                                      {section.title}
                                    </span>
                                    <Badge 
                                      variant={section.isPublished ? "success" : "secondary"}
                                      className="text-xs flex-shrink-0"
                                    >
                                      {section.isPublished ? "منتشر" : "پیش‌نویس"}
                                    </Badge>
                                  </Link>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};