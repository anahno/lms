// فایل: app/courses/[learningPathId]/sections/[sectionId]/layout.tsx
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getProgress } from "@/actions/get-progress";
import { CourseSidebar } from "../../../_components/CourseSidebar";
import { CourseNavbar } from "../../../_components/CourseNavbar";

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ learningPathId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/");

  const { learningPathId } = await params;

  const learningPath = await db.learningPath.findUnique({
    where: { id: learningPathId },
    include: {
      levels: {
        orderBy: { position: "asc" },
        include: {
          chapters: {
            where: { isPublished: true },
            orderBy: { position: "asc" },
            include: {
              sections: {
                where: { isPublished: true },
                orderBy: { position: "asc" },
                include: {
                  progress: { where: { userId: session.user.id } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!learningPath) return redirect("/");

  const progressCount = await getProgress(session.user.id, learningPath.id);

  return (
    <div className="h-full">
      <div className="h-[80px] fixed inset-y-0 w-full z-50">
        <CourseNavbar
          learningPath={learningPath}
          progressCount={progressCount}
        />
      </div>
      <div className="hidden md:flex h-full w-80 flex-col fixed inset-y-0 z-50 pt-[80px]">
        <CourseSidebar
          learningPath={learningPath}
          progressCount={progressCount}
        />
      </div>
      <main className="md:pr-80 pt-[80px] h-full">
        {children}
      </main>
    </div>
  );
}