
// فایل: app/(dashboard)/browse-courses/_components/CourseListItem.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { Users, Clock, ChevronDown, Loader2 } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { getStudentPerformance, StudentPerformance } from "@/actions/get-student-performance";
import { StudentPerformanceList } from "./StudentPerformanceList";
import { cn } from "@/lib/utils";
import { Rating } from "@/components/ui/rating";

// ... بقیه کد بدون تغییر
// (تمام فایل را کپی کنید تا مطمئن شوید import های بالا صحیح هستند)
type CourseWithDetails = Prisma.LearningPathGetPayload<{
    include: {
        user: true,
        _count: { select: { enrollments: true } },
        levels: {
            include: {
                chapters: {
                    include: {
                        sections: {
                            include: {
                                progress: {
                                    select: { rating: true }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}>;


interface CourseListItemProps {
    course: CourseWithDetails;
}

const calculateTotalHours = (levels: CourseWithDetails["levels"]): string => {
    const totalSeconds = levels.reduce((total, level) => {
        return total + level.chapters.reduce((chapterTotal, chapter) => {
            return chapterTotal + chapter.sections.reduce((sectionTotal, section) => {
                return sectionTotal + (section.duration || 0);
            }, 0);
        }, 0);
    }, 0);

    if (totalSeconds === 0) return "۰";
   const hoursNumber = totalSeconds / 3600;
   return hoursNumber.toLocaleString("fa-IR", {
       minimumFractionDigits: 1,
       maximumFractionDigits: 1,
   });
};

const calculateAverageRating = (levels: CourseWithDetails["levels"]): { average: number; count: number } => {
    const allRatings = levels.flatMap(level =>
        level.chapters.flatMap(chapter =>
            chapter.sections.flatMap(section =>
                section.progress.map(p => p.rating)
            )
        )
    ).filter((r): r is number => r !== null);

    if (allRatings.length === 0) {
        return { average: 0, count: 0 };
    }

    const sum = allRatings.reduce((a, b) => a + b, 0);
    return {
        average: sum / allRatings.length,
        count: allRatings.length,
    };
};


export const CourseListItem = ({ course }: CourseListItemProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [studentData, setStudentData] = useState<StudentPerformance[] | null>(null);

    const totalHours = calculateTotalHours(course.levels);
    const { average: averageRating, count: ratingCount } = calculateAverageRating(course.levels);
    const studentCount = course._count.enrollments;
    const instructor = course.user;

    const handleToggleExpand = async () => {
        if (isExpanded) {
            setIsExpanded(false);
           return;
       }

        if (!studentData) {
            setIsLoading(true);
            const data = await getStudentPerformance(course.id);
           setStudentData(data);
            setIsLoading(false);
        }
        setIsExpanded(true);
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 border rounded-lg p-4 bg-white shadow-sm transition hover:shadow-md">
            <div className="flex-1 bg-slate-50 p-4 rounded-lg border flex flex-col">
                 <h2 className="text-xl font-bold text-slate-800">{course.title}</h2>
                 <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                     {course.subtitle || "این دوره فاقد توضیحات کوتاه است."}
                 </p>
                 <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mt-4 text-sm font-medium text-slate-700">

                    <button                        onClick={handleToggleExpand}
                       disabled={isLoading}
                        className="flex items-center gap-x-2 p-1 rounded-md hover:bg-slate-200 transition disabled:cursor-wait"
                    >
                        <Users className="h-5 w-5 text-sky-600" />
                        <span>{studentCount.toLocaleString("fa-IR")} دانشجو</span>
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                           <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                        )}
                    </button>
                     <div className="flex items-center gap-x-2">
                         <Clock className="h-5 w-5 text-sky-600" />
                         <span>حدود {totalHours} ساعت محتوا</span>
                     </div>
                 </div>

               {isExpanded && (
                    <div className="mt-4">
                        {isLoading ? (
                            <div className="text-center p-4">در حال بارگذاری اطلاعات دانشجویان...</div>
                        ) : (
                            <StudentPerformanceList students={studentData || []} />
                        )}
                    </div>
               )}
             </div>

            <div className="w-full md:w-48 flex-shrink-0 flex flex-col items-center justify-center bg-sky-50 p-4 rounded-lg border text-center">
                <div className="relative w-20 h-20 mb-3">
                    <Image
                        src={instructor.image || "/images/default-avatar.png"}
                        alt={instructor.name || "تصویر استاد"}
                        fill
                        className="rounded-full object-cover border-2 border-white shadow"
                    />
                </div>
                <p className="font-bold text-slate-900">{instructor.name || "نامشخص"}</p>
                
                <div className="flex flex-col items-center gap-y-1 mt-2" title={`میانگین امتیاز: ${averageRating.toFixed(1)} از ${ratingCount} رای`}>
                    {ratingCount > 0 ? (
                        <>
                            <Rating rating={averageRating} size={20} />
                            <span className="text-xs text-muted-foreground">
                                ({ratingCount.toLocaleString('fa-IR')} رای)
                            </span>
                        </>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">هنوز امتیازی ثبت نشده</span>
                    )}
                </div>
            </div>
        </div>
    );
};