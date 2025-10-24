// فایل: components/CourseSchema.tsx
import { LearningPath, User } from "@prisma/client";

// نوع داده ورودی را مشخص می‌کنیم تا شامل اطلاعات مدرس هم باشد
interface CourseSchemaProps {
  course: LearningPath & { user: User };
}

// این یک Server Component است و می‌تواند در سمت سرور اجرا شود
export const CourseSchema = ({ course }: CourseSchemaProps) => {
  // محاسبه قیمت نهایی با در نظر گرفتن تخفیف
  const finalPrice = course.discountPrice !== null && course.discountPrice < (course.price || Infinity)
    ? course.discountPrice
    : course.price;

  // ساختار داده JSON-LD بر اساس استاندارد schema.org برای نوع "Course"
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title, // نام دوره
    "description": course.metaDescription || course.subtitle, // توضیحات دوره
    "provider": {
      "@type": "Organization",
      "name": "LMS پلتفرم", // نام پلتفرم یا وب‌سایت شما
      "sameAs": process.env.NEXT_PUBLIC_APP_URL // آدرس وب‌سایت شما
    },
    // اطلاعات مربوط به قیمت‌گذاری
    ...(finalPrice !== null && {
      "offers": {
        "@type": "Offer",
        "price": finalPrice,
        "priceCurrency": "IRR", // کد ارز ریال ایران (می‌توانید به Toman هم تغییر دهید اما IRR استانداردتر است)
        "availability": "https://schema.org/OnlineOnly"
      }
    }),
    "courseCode": course.id, // یک شناسه منحصر به فرد برای دوره
    "educationalLevel": course.level, // سطح دوره (مقدماتی، متوسط و...)
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "online", // حالت برگزاری دوره
      // اطلاعات مدرس دوره
      "instructor": {
        "@type": "Person",
        "name": course.user.name || "مدرس پلتفرم"
      }
    }
  };

  // تزریق اسکریپت JSON-LD به head صفحه
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
    />
  );
};