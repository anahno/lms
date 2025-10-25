// فایل: app/api/learning-paths/route.ts

import {  NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// --- شروع اصلاح کلیدی: بازنویسی کامل تابع generateSlug ---
function generateSlug(title: string): string {
  // +++ علامت پلاس (+) به لیست کاراکترهای مجاز اضافه شد +++
  const allowedChars = "a-zA-Z0-9\u0600-\u06FF\\+"; // حروف انگلیسی، اعداد، فارسی/عربی و علامت +
  
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') // ۱. تمام فاصله‌ها را با یک خط تیره جایگزین کن
    // ۲. هر کاراکتری که جزو حروف مجاز یا خط تیره نیست را حذف کن
    .replace(new RegExp(`[^${allowedChars}\\-]+`, 'g'), '') 
    .replace(/--+/g, '-') // ۳. چند خط تیره پشت سر هم را به یکی تبدیل کن
    .replace(/^-+|-+$/g, ''); // ۴. خط تیره اضافی از ابتدا یا انتهای رشته را حذف کن
}
// --- پایان اصلاح کلیدی ---

// تابع POST برای ایجاد یک مسیر یادگیری جدید
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title } = body;

    if (!title) {
      return new NextResponse("Title is required", { status: 400 });
    }

    // ساخت اسلاگ و بررسی یکتا بودن آن
const baseSlug = generateSlug(title); // <--- تغییر در اینجا
    let slug = baseSlug;
    let counter = 1;

    // این منطق بدون تغییر باقی می‌ماند
    while (await db.learningPath.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const learningPath = await db.learningPath.create({
      data: {
        title: title,
        userId: session.user.id,
        slug: slug,
      },
    });

    return NextResponse.json(learningPath);

  } catch (error) {
    console.log("[LEARNING_PATHS_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// تابع GET بدون تغییر باقی می‌ماند
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const learningPaths = await db.learningPath.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(learningPaths);

  } catch (error) {
    console.error("[LEARNING_PATHS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}