// فایل: app/(dashboard)/qa-center/page.tsx
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Prisma, Role } from "@prisma/client";
import Link from "next/link";

export default async function QACenterPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirect("/login");
  }

  const userId = session.user.id;
  const userRole = (session.user as { role: Role }).role;

  // شرط برای واکشی سوالات بر اساس نقش کاربر
  const whereClause: Prisma.DiscussionWhereInput = {
    parentId: null, // فقط سوالات اصلی
    // اگر استاد بود، فقط سوالات دوره‌های خودش
    ...(userRole === "INSTRUCTOR" && {
      section: {
        chapter: {
          level: {
            learningPath: { userId }
          }
        }
      }
    }),
  };

  const allQuestions = await db.discussion.findMany({
    where: whereClause,
    include: {
      user: { select: { name: true } },
      replies: { include: { user: { select: { role: true } } } },
      section: {
        select: {
          id: true,
          title: true,
          chapter: {
            select: {
              level: {
                select: {
                  learningPathId: true,
                  learningPath: { select: { title: true } }
                }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // فیلتر کردن سوالاتی که هنوز پاسخی از طرف استاد یا ادمین ندارند
  const unansweredQuestions = allQuestions.filter(q => 
    !q.replies.some(r => r.user.role === 'INSTRUCTOR' || r.user.role === 'ADMIN')
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">مرکز پرسش و پاسخ (سوالات بی‌پاسخ)</h1>
      
      {unansweredQuestions.length > 0 ? (
        <div className="space-y-4">
          {unansweredQuestions.map(q => (
            <Link
              key={q.id}
              href={`/courses/${q.section.chapter.level.learningPathId}/sections/${q.section.id}`}
              className="block p-4 border rounded-lg bg-white hover:bg-slate-50 shadow-sm transition"
            >
              <div className="flex justify-between items-start">
                  <div>
                      <p className="font-semibold text-slate-800 line-clamp-2">{q.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">پرسیده شده توسط: {q.user.name}</p>
                  </div>
                  <span className="text-xs text-white bg-sky-600 px-2 py-1 rounded-md whitespace-nowrap">
                    جدید
                  </span>
              </div>
              <div className="border-t mt-3 pt-2 text-xs text-slate-600">
                  <span>دوره: <strong>{q.section.chapter.level.learningPath.title}</strong></span>
                  <span className="mx-2">|</span>
                  <span>بخش: <strong>{q.section.title}</strong></span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground mt-10">
          <p>هیچ سوال بی‌پاسخی وجود ندارد. آفرین!</p>
        </div>
      )}
    </div>
  );
}