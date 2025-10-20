// فایل: actions/discussion-actions.ts
"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// نوع داده خروجی برای استفاده در کلاینت
export type DiscussionWithReplies = Awaited<ReturnType<typeof getDiscussionsForSection>>[0];

/**
 * یک سوال یا پاسخ جدید را در دیتابیس ثبت می‌کند
 */
export const postQuestionOrReply = async (
  content: string,
  sectionId: string,
  parentId: string | null = null
) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "برای ارسال پیام باید وارد شوید." };
  }

  if (!content.trim()) {
    return { error: "متن پیام نمی‌تواند خالی باشد." };
  }

  try {
    await db.discussion.create({
      data: {
        content,
        sectionId,
        parentId,
        userId: session.user.id,
      },
    });

    // Revalidate صفحه دوره برای نمایش فوری پیام جدید
    const section = await db.section.findUnique({
        where: { id: sectionId },
        select: { chapter: { select: { level: { select: { learningPathId: true }}}}}
    });
    if (section) {
        revalidatePath(`/courses/${section.chapter.level.learningPathId}/sections/${sectionId}`);
    }

    return { success: "پیام شما با موفقیت ثبت شد." };
  } catch (error) {
    console.error("[POST_DISCUSSION_ERROR]", error);
    return { error: "خطایی در ثبت پیام رخ داد." };
  }
};

/**
 * تمام گفتگوهای یک بخش خاص را به صورت تودرتو واکشی می‌کند
 */
export const getDiscussionsForSection = async (sectionId: string) => {
  try {
    const discussions = await db.discussion.findMany({
      where: {
        sectionId,
        parentId: null, // فقط سوالات اصلی (سطح بالا)
      },
      include: {
        user: { select: { id: true, name: true, image: true, role: true } },
        // پاسخ‌ها به سوالات اصلی را هم واکشی کن
        replies: {
          include: {
            user: { select: { id: true, name: true, image: true, role: true } },
          },
          orderBy: { createdAt: 'asc' }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return discussions;
  } catch (error) {
    console.error("[GET_DISCUSSIONS_ERROR]", error);
    return [];
  }
};