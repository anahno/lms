// فایل: app/courses/[learningPathId]/sections/[sectionId]/page.tsx
"use server";

import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { CourseProgressButton } from "../../../_components/CourseProgressButton";

export default async function SectionIdPage({
  params,
}: {
  params: Promise<{ learningPathId: string; sectionId: string }>;
}) {
  const { learningPathId, sectionId } = await params;
  
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/");

  const section = await db.section.findUnique({
    where: { id: sectionId, isPublished: true },
    include: {
      progress: { where: { userId: session.user.id } },
    },
  });

  if (!section) return redirect("/");

  const allSectionsInOrder = await db.section.findMany({
    where: {
      chapter: { level: { learningPathId: learningPathId } },
      isPublished: true,
    },
    orderBy: [
      { chapter: { level: { position: 'asc' } } },
      { chapter: { position: 'asc' } },
      { position: 'asc' },
    ],
    select: { id: true },
  });

  const currentSectionIndex = allSectionsInOrder.findIndex(s => s.id === sectionId);
  const nextSection = allSectionsInOrder[currentSectionIndex + 1];
  const isCompleted = !!section.progress[0]?.isCompleted;

  return (
    <div className="p-4 md:p-8 flex flex-col h-full">
      <div className="flex-grow">
        <h1 className="text-2xl md:text-3xl font-semibold mb-4">{section.title}</h1>
        
        {section.videoUrl && (
          <div className="relative aspect-video">
            <video
              src={section.videoUrl}
              controls
              className="w-full h-full rounded-md bg-slate-900"
            />
          </div>
        )}
        
        <div
          className="mt-8 prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: section.description || "" }}
        />
      </div>
      
      <div className="mt-8 border-t pt-4">
        <CourseProgressButton
          sectionId={sectionId}
          learningPathId={learningPathId}
          nextSectionId={nextSection?.id}
          isCompleted={isCompleted}
        />
      </div>
    </div>
  );
}