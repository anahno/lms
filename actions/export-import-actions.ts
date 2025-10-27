// فایل: actions/export-import-actions.ts
"use server";

import { db } from "@/lib/db";
import { LearningPath, CourseStatus, CourseLevel } from "@prisma/client";
import * as z from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// تعریف ساختارهای داده برای خروجی JSON (برای Type Safety)
interface ExportedQuizQuestionOption {
  متن: string;
  صحیح_است: boolean;
}

interface ExportedQuizQuestion {
  نوع: string;
  متن_سوال: string;
  امتیاز: number;
  گزینه‌ها: ExportedQuizQuestionOption[];
}

interface ExportedQuiz {
  عنوان: string;
  سوالات: ExportedQuizQuestion[];
}

interface ExportedSection {
  عنوان: string;
  توضیحات: string | null;
  آدرس_ویدیو: string | null;
  آدرس_صوت: string | null;
  مدت_زمان_ثانیه: number | null;
  رایگان_است: boolean;
  کوئیز: ExportedQuiz | null;
}

interface ExportedChapter {
  عنوان: string;
  رایگان_است: boolean;
  بخش‌ها: ExportedSection[];
}

interface ExportedLevel {
  عنوان: string;
  فصل‌ها: ExportedChapter[];
}

interface ExportedCourse {
  metadata: {
    نسخه_فایل: string;
    تاریخ_خروجی: string;
    منبع: string;
  };
  دوره: {
    عنوان: string;
    عنوان_کوتاه: string | null;
    اسلاگ: string;
    توضیحات: string | null;
    آنچه_خواهید_آموخت: string[];
    پیش_نیازها: string[];
    سطح: CourseLevel | null;
    وضعیت: CourseStatus;
    قیمت: number | null;
    قیمت_با_تخفیف: number | null;
    آدرس_تصویر: string | null;
    آدرس_صوت_معرفی: string | null;
    دسته‌بندی: string | null;
    سئو: {
      عنوان_متا: string | null;
      توضیحات_متا: string | null;
      کلمات_کلیدی_متا: string[];
    };
    سطوح: ExportedLevel[];
  };
}

// schema با Zod برای اعتبارسنجی اولیه فایل JSON ورودی
const courseImportSchema = z.object({
  دوره: z.object({
    عنوان: z.string().min(1),
    اسلاگ: z.string().min(1),
  }),
});

/**
 * اطلاعات کامل یک دوره را برای خروجی گرفتن به فرمت JSON واکشی و تبدیل می‌کند
 */
export const exportCourseAsJson = async (learningPathId: string): Promise<ExportedCourse> => {
  const course = await db.learningPath.findUnique({
    where: { id: learningPathId },
    include: {
      category: true,
      levels: {
        orderBy: { position: "asc" },
        include: {
          chapters: {
            orderBy: { position: "asc" },
            include: {
              sections: {
                orderBy: { position: "asc" },
                include: {
                  quiz: {
                    include: {
                      questions: {
                        orderBy: { position: "asc" },
                        include: {
                          options: {
                            orderBy: { id: "asc" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!course) {
    throw new Error("دوره یافت نشد.");
  }

  const exportedJson: ExportedCourse = {
    metadata: {
      نسخه_فایل: "1.0",
      تاریخ_خروجی: new Date().toISOString(),
      منبع: "LMS Platform",
    },
    دوره: {
      عنوان: course.title,
      عنوان_کوتاه: course.subtitle,
      اسلاگ: course.slug,
      توضیحات: course.description,
      آنچه_خواهید_آموخت: course.whatYouWillLearn,
      پیش_نیازها: course.requirements,
      سطح: course.level,
      وضعیت: course.status,
      قیمت: course.price,
      قیمت_با_تخفیف: course.discountPrice,
      آدرس_تصویر: course.imageUrl,
      آدرس_صوت_معرفی: course.introAudioUrl,
      دسته‌بندی: course.category?.name ?? null,
      سئو: {
        عنوان_متا: course.metaTitle,
        توضیحات_متا: course.metaDescription,
        کلمات_کلیدی_متا: course.metaKeywords,
      },
      سطوح: course.levels.map(level => ({
        عنوان: level.title,
        فصل‌ها: level.chapters.map(chapter => ({
          عنوان: chapter.title,
          رایگان_است: chapter.isFree,
          بخش‌ها: chapter.sections.map(section => ({
            عنوان: section.title,
            توضیحات: section.description,
            آدرس_ویدیو: section.videoUrl,
            آدرس_صوت: section.audioUrl,
            مدت_زمان_ثانیه: section.duration,
            رایگان_است: section.isFree,
            کوئیز: section.quiz ? {
              عنوان: section.quiz.title,
              سوالات: section.quiz.questions.map(q => ({
                نوع: q.type,
                متن_سوال: q.text,
                امتیاز: q.points,
                گزینه‌ها: q.options.map(opt => ({
                  متن: opt.text,
                  صحیح_است: opt.isCorrect,
                })),
              })),
            } : null,
          })),
        })),
      })),
    },
  };

  return exportedJson;
};

/**
 * یک دوره جدید را از محتوای یک فایل JSON در دیتابیس ایجاد می‌کند
 */
export const importCourseFromJson = async (jsonContent: string): Promise<{ success: true; courseId: string } | { error: string }> => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "برای وارد کردن دوره، ابتدا باید وارد حساب کاربری خود شوید." };
    }
    const userId = session.user.id;

    const data = JSON.parse(jsonContent);
    courseImportSchema.parse(data);

    const courseData = data.دوره;

    let categoryId: string | undefined = undefined;
    if (courseData.دسته‌بندی) {
      const category = await db.category.findUnique({ where: { name: courseData.دسته‌بندی } });
      if (category) {
        categoryId = category.id;
      } else {
        return { error: `دسته‌بندی "${courseData.دسته‌بندی}" یافت نشد. لطفاً ابتدا آن را ایجاد کنید.` };
      }
    }
    
    let finalSlug = courseData.اسلاگ;
    const existingCourse = await db.learningPath.findUnique({ where: { slug: finalSlug } });
    if (existingCourse) {
      finalSlug = `${finalSlug}-${Date.now()}`;
    }

    const newCourse = await db.learningPath.create({
      data: {
        title: courseData.عنوان,
        slug: finalSlug,
        subtitle: courseData.عنوان_کوتاه,
        description: courseData.توضیحات,
        whatYouWillLearn: courseData.آنچه_خواهید_آموخت,
        requirements: courseData.پیش_نیازها,
        level: courseData.سطح,
        status: "DRAFT",
        price: courseData.قیمت,
        discountPrice: courseData.قیمت_با_تخفیف,
        imageUrl: courseData.آدرس_تصویر,
        introAudioUrl: courseData.آدرس_صوت_معرفی,
        categoryId: categoryId,
        metaTitle: courseData.سئو.عنوان_متا,
        metaDescription: courseData.سئو.توضیحات_متا,
        metaKeywords: courseData.سئو.کلمات_کلیدی_متا,
        userId: userId, // <-- استفاده از ID کاربر لاگین کرده
        levels: {
          create: courseData.سطوح.map((level: any, levelIndex: number) => ({
            title: level.عنوان,
            position: levelIndex + 1,
            chapters: {
              create: level.فصل‌ها.map((chapter: any, chapterIndex: number) => ({
                title: chapter.عنوان,
                position: chapterIndex + 1,
                isFree: chapter.رایگان_است,
                sections: {
                  create: chapter.بخش‌ها.map((section: any, sectionIndex: number) => ({
                    title: section.عنوان,
                    position: sectionIndex + 1,
                    description: section.توضیحات,
                    videoUrl: section.آدرس_ویدیو,
                    audioUrl: section.آدرس_صوت,
                    duration: section.مدت_زمان_ثانیه,
                    isFree: section.رایگان_است,
                    quiz: section.کوئیز ? {
                      create: {
                        title: section.کوئیز.عنوان,
                        questions: {
                          create: section.کوئیز.سوالات.map((q: any, qIndex: number) => ({
                            text: q.متن_سوال,
                            type: q.نوع,
                            points: q.امتیاز,
                            position: qIndex + 1,
                            options: {
                              createMany: {
                                data: q.گزینه‌ها.map((opt: any) => ({
                                  text: opt.متن,
                                  isCorrect: opt.صحیح_است,
                                })),
                              },
                            },
                          })),
                        },
                      },
                    } : undefined,
                  })),
                },
              })),
            },
          })),
        },
      },
    });

    return { success: true, courseId: newCourse.id };

  } catch (error: any) {
    console.error("[COURSE_IMPORT_ERROR]", error);
    if (error instanceof z.ZodError) {
      return { error: "ساختار فایل JSON نامعتبر است." };
    }
    return { error: "خطا در پردازش فایل. لطفاً از صحت ساختار فایل مطمئن شوید." };
  }
};