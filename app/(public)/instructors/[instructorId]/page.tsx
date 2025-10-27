// فایل: app/(public)/instructors/[instructorId]/page.tsx
"use server";

import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Image from "next/image";
import { CourseCatalogCard } from "@/components/CourseCatalogCard";
import { BookOpen } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";
import { MentorshipBookingSection } from "./_components/MentorshipBookingSection";

// +++ ۱. اکشن جدید را وارد می‌کنیم +++
import { cleanupExpiredMentorshipBookings } from "@/actions/booking-actions";


export default async function InstructorProfilePage({
  params,
}: {
  params: Promise<{ instructorId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const { instructorId } = await params;

  // +++ ۲. قبل از واکشی داده‌ها، تابع پاک‌سازی را اجرا می‌کنیم +++
  // این تضمین می‌کند که داده‌هایی که در ادامه واکشی می‌کنیم، تمیز و به‌روز هستند.
  await cleanupExpiredMentorshipBookings(instructorId);


  // از اینجا به بعد، بقیه کد بدون تغییر است
  const instructor = await db.user.findUnique({
    where: {
      id: instructorId,
      OR: [
        { role: Role.INSTRUCTOR },
        { role: Role.ADMIN }
      ],
    },
    include: {
      learningPaths: {
        where: { status: 'PUBLISHED' },
        include: {
          category: true,
          levels: {
            include: {
              chapters: {
                where: { isPublished: true },
                select: { id: true },
              },
            },
          },
          enrollments: {
            where: { userId },
          },
        },
      },
      mentorProfile: true,
      mentorTimeSlots: {
        where: {
                    status: { in: ['AVAILABLE', 'BOOKED'] }, // <-- اصلاح اصلی

          startTime: { gte: new Date() }
        },
        orderBy: {
          startTime: 'asc'
        }
      }
    },
  });

  if (!instructor) {
    return redirect("/");
  }

  const isOwner = userId === instructorId;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 border-b pb-12 mb-12">
        <div className="relative w-40 h-40 flex-shrink-0">
          <Image
            src={instructor.image || "/images/default-avatar.png"}
            alt={instructor.name || "تصویر استاد"}
            fill
            className="rounded-full object-cover border-4 border-white shadow-lg"
          />
        </div>
        <div className="text-center md:text-right">
          <h1 className="text-4xl font-extrabold text-slate-800">{instructor.name}</h1>
          <p className="text-lg text-sky-600 font-semibold mt-1">
            {instructor.role === Role.ADMIN ? "ادمین و مدرس" : "مدرس و متخصص"}
          </p>
          <p className="text-slate-600 mt-4 max-w-2xl">
            {instructor.bio || "بیوگرافی این مدرس هنوز تکمیل نشده است."}
          </p>
        </div>
      </div>

      {instructor.mentorProfile?.isEnabled && (
        <MentorshipBookingSection
          mentor={instructor}
          isOwner={isOwner}
        />
      )}

      <div>
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-sky-600" />
            دوره‌های ارائه شده توسط {instructor.name}
        </h2>
        {instructor.learningPaths.length > 0 ? (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {instructor.learningPaths.map((course) => {
              const totalChapters = course.levels.reduce((acc, level) => acc + level.chapters.length, 0);
              return (
                <CourseCatalogCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  imageUrl={course.imageUrl}
                  chaptersLength={totalChapters}
                  category={course.category?.name || "بدون دسته‌بندی"}
                  isEnrolled={course.enrollments.length > 0}
                  price={course.price}
                  discountPrice={course.discountPrice}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center text-md text-muted-foreground mt-10 bg-slate-50 p-8 rounded-xl">
            <p>این مدرس هنوز دوره‌ای را منتشر نکرده است.</p>
          </div>
        )}
      </div>
    </div>
  );
}