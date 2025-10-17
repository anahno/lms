// فایل: app/(public)/courses/[learningPathId]/page.tsx  <-- کد صحیح برای این فایل

"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Book, CheckCircle, Layers, User } from "lucide-react";
import { EnrollButton } from "@/components/EnrollButton";
import { ViewCourseButton } from "@/components/ViewCourseButton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CourseLandingPage({
  params,
}: {
  params: { learningPathId: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // ۱. واکشی تمام اطلاعات مورد نیاز دوره با یک کوئری
  const course = await db.learningPath.findUnique({
    where: {
      id: params.learningPathId,
      status: "PUBLISHED", // فقط دوره‌های منتشر شده قابل مشاهده هستند
    },
    include: {
      category: true,
      user: true, // اطلاعات مدرس (استاد)
      levels: {
        orderBy: { position: "asc" },
        include: {
          chapters: {
            where: { isPublished: true },
            orderBy: { position: "asc" },
          },
        },
      },
      enrollments: {
        where: { userId: userId }, // بررسی اینکه آیا کاربر فعلی ثبت‌نام کرده
      },
    },
  });

  // اگر دوره وجود نداشت یا منتشر نشده بود، کاربر را به صفحه اصلی دوره‌ها هدایت کن
  if (!course) {
    return redirect("/courses");
  }

  const isEnrolled = course.enrollments.length > 0;
  const isOwner = course.userId === userId;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* ستون اصلی: محتوای دوره */}
        <div className="lg:col-span-2 space-y-12">
          <h1 className="text-4xl font-extrabold tracking-tight">{course.title}</h1>
          {course.subtitle && (
            <p className="text-xl text-slate-600 mt-2">{course.subtitle}</p>
          )}

          {/* اطلاعات مدرس و دسته‌بندی */}
          <div className="flex items-center gap-x-6 text-sm text-slate-700">
            <div className="flex items-center gap-x-2">
              <User className="h-5 w-5" />
              <span>مدرس: {course.user.name || "ناشناس"}</span>
            </div>
            <div className="flex items-center gap-x-2">
              <Layers className="h-5 w-5" />
              <span>دسته‌بندی: {course.category?.name || "عمومی"}</span>
            </div>
          </div>
          {/* --- بخش جدید: نمایش فایل صوتی معرفی --- */}
          {course.introAudioUrl && (
            <section>
              <h2 className="text-2xl font-bold mb-4">راهنمای صوتی دوره</h2>
              <audio
                src={course.introAudioUrl}
                controls
                className="w-full rounded-lg"
              />
            </section>
          )}
          {/* --- پایان بخش جدید --- */}
          {/* توضیحات کامل دوره */}
          <section>
            <h2 className="text-2xl font-bold mb-4">توضیحات دوره</h2>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: course.description || "" }}
            />
          </section>

          {/* آنچه خواهید آموخت */}
          <section>
            <h2 className="text-2xl font-bold mb-4">آنچه خواهید آموخت</h2>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
              {course.whatYouWillLearn.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* سرفصل‌های دوره */}
          <section>
            <h2 className="text-2xl font-bold mb-4">سرفصل‌های دوره</h2>
            <div className="space-y-4">
              {course.levels.map((level) => (
                <div key={level.id} className="border rounded-lg">
                  <h3 className="font-bold p-4 bg-slate-100 rounded-t-lg">
                    {level.title}
                  </h3>
                  <ul className="divide-y">
                    {level.chapters.map((chapter) => (
                      <li key={chapter.id} className="p-4 text-sm">
                        {chapter.title}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ستون کناری: تصویر و دکمه خرید */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 space-y-6">
            <div className="aspect-video relative rounded-xl overflow-hidden shadow-lg">
              {course.imageUrl ? (
                <Image
                  fill
                  className="object-cover"
                  alt={course.title}
                  src={course.imageUrl}
                />
              ) : (
                <div className="h-full w-full bg-slate-200 flex items-center justify-center">
                  <Book className="h-16 w-16 text-slate-400" />
                </div>
              )}
            </div>
            
            <div className="p-6 border rounded-lg bg-white shadow-sm text-center">
              <h3 className="text-2xl font-bold mb-4">
                {course.price && course.price > 0 ? `${course.price.toLocaleString()} تومان` : "رایگان"}
              </h3>
              
              {/* منطق نمایش دکمه مناسب */}
              <div className="mt-6">
                {isOwner ? (
                  <Link href={`/learning-paths/${course.id}/edit`}>
                    <Button className="w-full">ویرایش دوره</Button>
                  </Link>
                ) : isEnrolled ? (
                  <ViewCourseButton learningPathId={course.id} />
                ) : (
                  <EnrollButton learningPathId={course.id} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}