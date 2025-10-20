// فایل: app/(dashboard)/browse-courses/page.tsx
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Prisma, Role } from "@prisma/client";
import { CourseListItem } from "./_components/CourseListItem";

export default async function BrowseCoursesPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return redirect("/login");
    }

    const userId = session.user.id;
    const userRole = (session.user as { role: Role }).role;

    // اگر کاربر استاد باشد، فقط دوره‌های خودش را نشان بده
    const whereClause: Prisma.LearningPathWhereInput = 
        userRole === "INSTRUCTOR" ? { userId } : {};

    const courses = await db.learningPath.findMany({
        where: whereClause,
        include: {
            user: true, // اطلاعات استاد
            _count: {
                select: { enrollments: true }, // تعداد دانشجویان
            },
            levels: {
                include: {
                    chapters: {
                        include: {
                            sections: {
                                select: { duration: true }, // برای محاسبه مجموع ساعات
                            },
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">فهرست دوره‌ها</h1>
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