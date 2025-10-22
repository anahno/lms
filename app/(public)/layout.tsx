// فایل: app/(public)/layout.tsx
import { PublicNavbar } from "@/components/PublicNavbar";
import { Footer } from "@/components/Footer";
import { headers } from "next/headers";
import { db } from "@/lib/db";

async function getDynamicRouteData() {
  // +++ ۱. کلمه await اینجا اضافه شده است +++
  const headerList = await headers();
  const pathname = headerList.get("x-next-pathname") || "";
  
  const segments = pathname.split("/").filter(Boolean);
  const dynamicRoutes: Record<string, string> = {};

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
  const dynamicRoutes = await getDynamicRouteData();

  return (
    // +++ کلاس bg-white از اینجا حذف شده است +++
    <div className="min-h-screen">
      <PublicNavbar dynamicRoutes={dynamicRoutes} />
      <main className="pt-10 pb-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}