// فایل: app/(public)/layout.tsx
import { PublicNavbar } from "@/components/PublicNavbar";
import { Footer } from "@/components/Footer";
// +++ ۱. ابزارهای لازم را وارد می‌کنیم +++
import { headers } from "next/headers";
import { db } from "@/lib/db";

// +++ ۲. یک تابع کمکی برای واکشی داده‌های داینامیک می‌سازیم +++
async function getDynamicRouteData() {
  const headerList = headers();
  const pathname = headerList.get("x-next-pathname") || "";
  const segments = pathname.split("/").filter(Boolean);
  const dynamicRoutes: Record<string, string> = {};

  // اگر در صفحه یک دوره خاص هستیم
  if (segments[0] === "courses" && segments.length >= 2) {
    const courseId = segments[1];
    const course = await db.learningPath.findUnique({
      where: { id: courseId },
      select: { title: true },
    });
    if (course) {
      dynamicRoutes[courseId] = course.title;
    }
  }
  
  // اگر در صفحه پروفایل استاد هستیم
  if (segments[0] === "instructors" && segments.length >= 2) {
    const instructorId = segments[1];
    const instructor = await db.user.findUnique({
        where: { id: instructorId },
        select: { name: true }
    });
    if(instructor && instructor.name) {
        dynamicRoutes[instructorId] = instructor.name;
    }
  }
  
  // اگر در صفحه نتایج یک دوره هستیم
    if (segments[0] === "my-courses" && segments.length >= 2) {
    const courseId = segments[1];
    const course = await db.learningPath.findUnique({
      where: { id: courseId },
      select: { title: true },
    });
    if (course) {
      dynamicRoutes[courseId] = course.title;
    }
  }


  return dynamicRoutes;
}


export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // +++ ۳. تابع را فراخوانی کرده و نتیجه را به PublicNavbar پاس می‌دهیم +++
  const dynamicRoutes = await getDynamicRouteData();

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar dynamicRoutes={dynamicRoutes} />
      <main className="pt-10 pb-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}