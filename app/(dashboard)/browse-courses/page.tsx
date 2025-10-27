// فایل: app/(dashboard)/browse-courses/page.tsx
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Prisma, Role } from "@prisma/client";
import { CourseListItem } from "./_components/CourseListItem";
import { CourseImportClient } from "./_components/CourseImportClient"; // ۱. کامپوننت جدید را import کنید

export default async function BrowseCoursesPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return redirect("/login");
    }

    const userId = session.user.id;
    const userRole = (session.user as { role: Role }).role;

    const whereClause: Prisma.LearningPathWhereInput = 
        userRole === "INSTRUCTOR" ? { userId } : {};

    const courses = await db.learningPath.findMany({
        where: whereClause,
        include: {
            user: true,
            _count: { select: { enrollments: true } },
            levels: { include: { chapters: { where: { isPublished: true }, include: { sections: { where: { isPublished: true }, include: { progress: { where: { rating: { not: null } }, select: { rating: true } } } } } } } }
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="p-6">
            {/* ========== شروع بخش جدید ========== */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">فهرست دوره‌ها</h1>
                <CourseImportClient />
            </div>
            {/* ========== پایان بخش جدید ========== */}

            {courses.length > 0 ? (
                <div className="space-y-4">
                    {courses.map(course => (
                        <CourseListItem key={course.id} course={course} />
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground mt-10">
                    <p>دوره‌ای برای نمایش یافت نشد.</p>
                </div>
            )}
        </div>
    );
}