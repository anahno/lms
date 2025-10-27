// فایل: app/(dashboard)/browse-courses/_components/CourseListItem.tsx
"use client";

import Image from "next/image";
import Link from "next/link"; // ۱. وارد کردن Link از next/link
import { useState } from "react";
import { Users, Clock, ChevronDown, Loader2, Download } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { getStudentPerformance, StudentPerformance } from "@/actions/get-student-performance";
import { StudentPerformanceList } from "./StudentPerformanceList";
import { cn } from "@/lib/utils";
import { Rating } from "@/components/ui/rating";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { exportCourseAsJson } from "@/actions/export-import-actions";

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
    const totalSeconds = levels.reduce((total, level) => total + level.chapters.reduce((chapterTotal, chapter) => chapterTotal + chapter.sections.reduce((sectionTotal, section) => sectionTotal + (section.duration || 0), 0), 0), 0);
    if (totalSeconds === 0) return "۰";
    const hoursNumber = totalSeconds / 3600;
    return hoursNumber.toLocaleString("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

const calculateAverageRating = (levels: CourseWithDetails["levels"]): { average: number; count: number } => {
    const allRatings = levels.flatMap(level => level.chapters.flatMap(chapter => chapter.sections.flatMap(section => section.progress.map(p => p.rating)))).filter((r): r is number => r !== null);
    if (allRatings.length === 0) return { average: 0, count: 0 };
    const sum = allRatings.reduce((a, b) => a + b, 0);
    return { average: sum / allRatings.length, count: allRatings.length };
};

export const CourseListItem = ({ course }: CourseListItemProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
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

    const handleExport = async () => {
        setIsExporting(true);
        toast.loading("در حال آماده‌سازی فایل خروجی...");
        try {
            const jsonData = await exportCourseAsJson(course.id);
            const jsonString = JSON.stringify(jsonData, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${course.slug}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.dismiss();
            toast.success("فایل JSON با موفقیت دانلود شد.");
        } catch (error) {
            toast.dismiss();
            toast.error("خطا در ایجاد فایل خروجی.");
            console.error(error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 border rounded-lg p-4 bg-white shadow-sm transition hover:shadow-md">
            <div className="flex-1 bg-slate-50 p-4 rounded-lg border flex flex-col">
                {/* ========== ۲. اضافه کردن تگ Link دور عنوان و توضیحات کوتاه ========== */}
                <Link href={`/learning-paths/${course.id}/edit`} className="group mb-4">
                    <h2 className="text-xl font-bold text-slate-800 group-hover:text-sky-700 transition-colors">{course.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 group-hover:text-sky-600 transition-colors">
                        {course.subtitle || "این دوره فاقد توضیحات کوتاه است."}
                    </p>
                </Link>
                {/* ==================================================================== */}

                 <div className="flex items-center flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-700">
                    <button onClick={handleToggleExpand} disabled={isLoading} className="flex items-center gap-x-2 p-1 rounded-md hover:bg-slate-200 transition disabled:cursor-wait">
                        <Users className="h-5 w-5 text-sky-600" />
                        <span>{studentCount.toLocaleString("fa-IR")} دانشجو</span>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />}
                    </button>
                     <div className="flex items-center gap-x-2">
                         <Clock className="h-5 w-5 text-sky-600" />
                         <span>حدود {totalHours} ساعت محتوا</span>
                     </div>
                 </div>

               {isExpanded && (
                    <div className="mt-4">
                        {isLoading ? <div className="text-center p-4">در حال بارگذاری اطلاعات...</div> : <StudentPerformanceList students={studentData || []} />}
                    </div>
               )}
             </div>

            <div className="w-full md:w-48 flex-shrink-0 flex flex-col items-center justify-center bg-sky-50 p-4 rounded-lg border text-center">
                <div className="relative w-20 h-20 mb-3">
                    <Image src={instructor.image || "/images/default-avatar.png"} alt={instructor.name || "تصویر استاد"} fill className="rounded-full object-cover border-2 border-white shadow" />
                </div>
                <p className="font-bold text-slate-900">{instructor.name || "نامشخص"}</p>
                
                <div className="flex flex-col items-center gap-y-1 mt-2" title={`میانگین امتیاز: ${averageRating.toFixed(1)} از ${ratingCount} رای`}>
                    {ratingCount > 0 ? (
                        <>
                            <Rating rating={averageRating} size={20} />
                            <span className="text-xs text-muted-foreground">({ratingCount.toLocaleString('fa-IR')} رای)</span>
                        </>
                    ) : <span className="text-xs text-muted-foreground italic">هنوز امتیازی ثبت نشده</span>}
                </div>

                <div className="mt-4 w-full">
                    <Button onClick={handleExport} variant="outline" size="sm" className="w-full" disabled={isExporting}>
                        {isExporting ? (
                            <>
                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                <span>در حال آماده‌سازی...</span>
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 ml-2" />
                                <span>خروجی JSON</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};