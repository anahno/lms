// فایل: app/(public)/courses/page.tsx
"use server";

import { db } from "@/lib/db";
import { CourseCatalogCard } from "@/components/CourseCatalogCard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { Filters } from "./_components/Filters";

interface CoursesCatalogPageProps {
  searchParams: {
    search?: string;
    category?: string;
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
    price?: 'free' | 'paid';
    sortBy?: 'newest' | 'popular';
  }
}

export default async function CoursesCatalogPage({ searchParams }: CoursesCatalogPageProps) {
  
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // ==================== شروع تغییرات کلیدی برای رفع خطا ====================
  const whereClause: Prisma.LearningPathWhereInput = {
    status: 'PUBLISHED',
    AND: [], // مقداردهی اولیه به عنوان یک آرایه خالی صحیح است
  };

  // اما برای اضافه کردن شرط‌ها باید به این صورت عمل کنیم
  const conditions: Prisma.LearningPathWhereInput[] = [];

  if (searchParams.search) {
    conditions.push({
      OR: [
        { title: { contains: searchParams.search, mode: 'insensitive' } },
        { description: { contains: searchParams.search, mode: 'insensitive' } },
        { subtitle: { contains: searchParams.search, mode: 'insensitive' } },
      ],
    });
  }

  if (searchParams.category) {
    conditions.push({ categoryId: searchParams.category });
  }

  if (searchParams.level && searchParams.level !== 'ALL_LEVELS') {
    conditions.push({ level: searchParams.level });
  }

  if (searchParams.price) {
    if (searchParams.price === 'free') {
      conditions.push({ OR: [{ price: null }, { price: 0 }] });
    } else if (searchParams.price === 'paid') {
      conditions.push({ price: { gt: 0 } });
    }
  }

  // در نهایت، آرایه شرط‌ها را به whereClause.AND اختصاص می‌دهیم
  if (conditions.length > 0) {
    whereClause.AND = conditions;
  }
  
  // ===================== پایان تغییرات کلیدی برای رفع خطا =====================

  let orderByClause: Prisma.LearningPathOrderByWithRelationInput = { createdAt: "desc" };

  if (searchParams.sortBy === 'popular') {
    orderByClause = { enrollments: { _count: 'desc' } };
  }
  
  const [courses, categories] = await Promise.all([
    db.learningPath.findMany({
      where: whereClause,
      include: {
        category: true,
        levels: {
          include: { chapters: { where: { isPublished: true }, select: { id: true } } }
        },
        enrollments: { where: { userId: userId } },
        _count: { select: { enrollments: true } }
      },
      orderBy: orderByClause,
    }),
    db.category.findMany({
        where: { parentId: null },
        include: { subcategories: { orderBy: { name: "asc" } } },
        orderBy: { name: "asc" }
    })
  ]);


  return (
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          کاتالوگ دوره‌ها
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          مسیر یادگیری خود را از بین بهترین دوره‌های آموزشی انتخاب کنید.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <Filters categories={categories} searchParams={searchParams} />
        </aside>

        <main className="md:col-span-3">
            {courses.length > 0 ? (
                <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => {
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
                                price={course.price} // +++ این خط اضافه شد +++
        discountPrice={course.discountPrice} // +++ این خط اضافه شد +++
                    />
                    );
                })}
                </div>
            ) : (
                <div className="text-center text-md text-muted-foreground mt-10 bg-slate-50 p-8 rounded-xl">
                    <p>متاسفانه با توجه به فیلترهای انتخابی، دوره‌ای یافت نشد.</p>
                </div>
            )}
        </main>
      </div>
    </div>
  );
}