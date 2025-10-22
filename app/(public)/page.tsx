// فایل: app/(public)/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { CourseCatalogCard } from "@/components/CourseCatalogCard";
import { BookOpen, School, Users, Clapperboard, TrendingUp, Clock, Award, Target, LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Category, Enrollment, LearningPath, Level } from "@prisma/client";
import { HomePageSearch } from "@/components/HomePageSearch";

type CourseForCard = (
  LearningPath & {
    category: Category | null;
    levels: (Level & {
      chapters: { id: string }[];
    })[];
    enrollments: Enrollment[];
  }
);

const CourseSection = ({ title, courses, icon: Icon }: { title: string, courses: CourseForCard[], icon?: LucideIcon }) => (
  <section className="py-16">
    <div className="flex justify-between items-center mb-10">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-8 h-8 text-sky-600" />}
        <h2 className="text-3xl font-bold text-slate-800">{title}</h2>
      </div>
      <Link href="/courses">
        <Button variant="outline" size="lg" className="hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300">
          مشاهده همه دوره‌ها
        </Button>
      </Link>
    </div>
    {courses.length > 0 ? (
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses.map((course) => {
          const totalChapters = course.levels.reduce((acc: number, level: { chapters: unknown[] }) => acc + level.chapters.length, 0);
          return (
            <CourseCatalogCard
              key={course.id}
              id={course.id}
              title={course.title}
              imageUrl={course.imageUrl}
              chaptersLength={totalChapters}
              category={course.category?.name || "بدون دسته‌بندی"}
              isEnrolled={course.enrollments.length > 0}
            />
          );
        })}
      </div>
    ) : (
      <div className="text-center py-12 bg-slate-50 rounded-xl">
        <p className="text-slate-500 text-lg">در حال حاضر دوره‌ای برای نمایش وجود ندارد.</p>
      </div>
    )}
  </section>
);

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const [
    studentCount,
    courseCount,
    instructorCount,
    publishedCourses,
    popularCourses,
    mainCategories,
  ] = await Promise.all([
    db.user.count({ where: { role: 'USER' } }),
    db.learningPath.count({ where: { status: 'PUBLISHED' } }),
    db.user.count({ where: { role: 'INSTRUCTOR' } }),
    db.learningPath.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        category: true,
        levels: { include: { chapters: { where: { isPublished: true }, select: { id: true } } } },
        enrollments: { where: { userId: userId } }
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.learningPath.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        category: true,
        levels: { include: { chapters: { where: { isPublished: true }, select: { id: true } } } },
        enrollments: { where: { userId: userId } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { enrollments: { _count: "desc" } },
      take: 8,
    }),
    db.category.findMany({
      where: { parentId: null },
      take: 16,
      orderBy: { name: 'asc' }
    })
  ]);

  const stats = [
    { icon: Users, value: `${(studentCount || 0).toLocaleString()}+`, label: "دانشجو فعال" },
    { icon: Clapperboard, value: `${(courseCount || 0).toLocaleString()}+`, label: "دوره آموزشی" },
    { icon: School, value: `${(instructorCount || 0).toLocaleString()}+`, label: "مدرس متخصص" },
    { icon: BookOpen, value: `${mainCategories.length}+`, label: "حوزه تخصصی" },
  ];

  const features = [
    { icon: Target, title: "مسیر یادگیری هدفمند", description: "با مسیرهای یادگیری ساختاریافته به اهداف خود برسید" },
    { icon: Award, title: "گواهینامه معتبر", description: "دریافت گواهینامه پایان دوره برای تقویت رزومه" },
    { icon: Clock, title: "یادگیری در هر زمان", description: "دسترسی نامحدود و مادام‌العمر به محتوای آموزشی" },
    { icon: TrendingUp, title: "به‌روز و کاربردی", description: "محتوای به‌روز شده با جدیدترین تکنولوژی‌های روز دنیا" }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f9fa' }}>
      {/* بخش Hero با گرادیانت */}
      <section className="relative bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
        
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-4 px-4 py-2 bg-sky-100 text-sky-700 rounded-full text-sm font-semibold">
              🎓 پلتفرم یادگیری آنلاین
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-4">
              با هزاران آموزش کاربردی،
            </h1>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-blue-600">
                همین امروز شروع کن و آینده رو بساز
              </span>
            </h2>
            
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              دسترسی به بیش از {courseCount} دوره آموزشی با کیفیت بالا در زمینه‌های مختلف فناوری و کسب‌وکار
            </p>

            <HomePageSearch />

          </div>
        </div>

        {/* موج دکوراتیو */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f7f9fa"/>
          </svg>
        </div>
      </section>

      <div className="container mx-auto px-4">
        {/* بخش آمار */}
        <section className="py-12 -mt-12">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="flex flex-col items-center text-center group">
                  <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-sky-600 transition-colors">
                    <stat.icon className="w-8 h-8 text-sky-600 group-hover:text-white transition-colors" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
                  <p className="text-slate-600 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* بخش ویژگی‌ها */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">چرا ما را انتخاب کنید؟</h2>
            <p className="text-slate-600 text-lg">بهترین تجربه یادگیری آنلاین را با ما تجربه کنید</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-xl border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-sky-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* بخش دسته‌بندی‌ها */}
        <section className="py-16 bg-gradient-to-br from-slate-50 to-sky-50 rounded-3xl my-10 px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">دسته‌بندی‌های آموزشی</h2>
            <p className="text-slate-600 text-lg">حوزه موردنظر خود را انتخاب کنید</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {mainCategories.map(category => (
              <Link key={category.id} href={`/courses?category=${category.id}`} className="block">
                <div className="p-5 border-2 border-slate-200 rounded-xl text-center bg-white hover:bg-sky-50 hover:border-sky-300 hover:shadow-lg hover:-translate-y-1 transition-all h-full flex items-center justify-center">
                  <p className="font-semibold text-slate-700">{category.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
        
        {/* بخش دوره‌های پرمخاطب */}
        <CourseSection title="محبوب‌ترین دوره‌ها" courses={popularCourses} icon={TrendingUp} />
        
        {/* بخش جدیدترین دوره‌ها */}
        <CourseSection title="جدیدترین دوره‌ها" courses={publishedCourses} icon={Clock} />

        {/* بخش Call to Action */}
        <section className="py-20" style={{ backgroundColor: '#f7f9fa' }}>
          <div className="bg-gradient-to-r from-sky-600 to-blue-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]"></div>
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">آماده شروع یادگیری هستید؟</h2>
              <p className="text-xl text-sky-100 mb-8">
                همین الان ثبت‌نام کنید و به هزاران دوره آموزشی دسترسی پیدا کنید
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-6 rounded-xl">
                    ثبت‌نام رایگان
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-xl bg-white/10 hover:bg-white/20 text-white border-white">
                    مشاهده دوره‌ها
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}