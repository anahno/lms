// فایل: app/(public)/courses/[learningPathId]/page.tsx

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
  
  const { learningPathId } = params;

  const course = await db.learningPath.findUnique({
    where: {
      id: learningPathId,
      status: "PUBLISHED",
    },
    include: {
      category: true,
      user: true,
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
        where: { userId: userId },
      },
    },
  });

  if (!course) {
    return redirect("/courses");
  }

  const isEnrolled = course.enrollments.length > 0;
  const isOwner = course.userId === userId;
  
  // +++ شروع منطق جدید برای قیمت و تخفیف +++
  const hasDiscount = course.discountPrice && course.price && course.discountPrice < course.price;
  const finalPrice = hasDiscount ? course.discountPrice : course.price;
  
  let discountPercent = 0;
  if (hasDiscount) {
      discountPercent = Math.round(((course.price! - course.discountPrice!) / course.price!) * 100);
  }
  // +++ پایان منطق جدید +++

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* ستون اصلی: محتوای دوره (بدون تغییر) */}
        <div className="lg:col-span-2 space-y-12">
            {/* ... تمام محتوای قبلی این بخش ... */}
             <h1 className="text-4xl font-extrabold tracking-tight">{course.title}</h1>
          {course.subtitle && (
            <p className="text-xl text-slate-600 mt-2">{course.subtitle}</p>
          )}

          {/* اطلاعات مدرس و دسته‌بندی */}
            <div className="flex items-center gap-x-6 text-sm text-slate-700">
              <div className="flex items-center gap-x-2">
                <User className="h-5 w-5" />
                <Link href={`/instructors/${course.user.id}`} className="hover:underline hover:text-sky-700">
                    <span>مدرس: {course.user.name || "ناشناس"}</span>
                </Link>
              </div>
              <div className="flex items-center gap-x-2">
                <Layers className="h-5 w-5" />
                <span>دسته‌بندی: {course.category?.name || "عمومی"}</span>
              </div>
            </div>
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
            <section>
                <h2 className="text-2xl font-bold mb-4">توضیحات دوره</h2>
                <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: course.description || "" }}
                />
            </section>

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
              
              {/* +++ شروع بخش نمایش قیمت اصلاح شده +++ */}
              <div className="mb-4">
                {finalPrice !== null && finalPrice > 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2">
                    {hasDiscount && (
                      <div className="flex items-center gap-x-2">
                        <span className="text-slate-500 line-through text-lg">
                          {course.price?.toLocaleString()} تومان
                        </span>
                        <span className="bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
                          {discountPercent}%
                        </span>
                      </div>
                    )}
                    <p className="text-3xl font-extrabold text-slate-800">
                      {finalPrice.toLocaleString()} تومان
                    </p>
                  </div>
                ) : (
                  <p className="text-3xl font-extrabold text-emerald-600">
                    رایگان!
                  </p>
                )}
              </div>
              {/* +++ پایان بخش نمایش قیمت اصلاح شده +++ */}

              <div className="mt-6">
                {isOwner ? (
                  <Link href={`/learning-paths/${course.id}/edit`}>
                    <Button className="w-full">ویرایش دوره</Button>
                  </Link>
                ) : isEnrolled ? (
                  <ViewCourseButton learningPathId={course.id} />
                ) : (
                  // قیمت نهایی (با تخفیف) را به دکمه پاس می‌دهیم
                  <EnrollButton learningPathId={course.id} price={finalPrice} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}