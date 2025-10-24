// فایل: middleware.ts
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";

// این تابع برای اضافه کردن هدر pathname برای کامپوننت Breadcrumbs است
function addPathnameHeader(req: NextRequest) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-next-pathname', req.nextUrl.pathname);
    return NextResponse.next({
        request: {
            headers: requestHeaders,
        }
    });
}

// این تابع اصلی میدلور است که به طور کامل بازنویسی شده
export async function middleware(req: NextRequest) {
    // توکن کاربر را برای بررسی وضعیت لاگین دریافت می‌کنیم
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = req.nextUrl;

    // --- تعریف مسیرهای محافظت شده ---
    // اینها مسیرهایی هستند که یک کاربر مهمان (وارد نشده) هرگز نباید ببیند.
    // مهم: مسیر پخش دوره (/courses/.../sections) در این لیست نیست.
    const strictlyProtectedPaths = [
        "/my-courses",
        "/my-account",
        "/dashboard",
        "/learning-paths", // صفحات ساخت و ویرایش دوره
        "/grading",
        "/qa-center",
        "/admin",
        "/browse-courses", // این بخش از داشبورد استاد/ادمین است
        "/categories",
    ];

    // بررسی می‌کنیم که آیا مسیر فعلی یکی از مسیرهای کاملاً محافظت شده است یا خیر.
    const isStrictlyProtected = strictlyProtectedPaths.some(p => pathname.startsWith(p));

    // --- منطق اصلی کنترل دسترسی ---

    // ۱. اگر مسیر محافظت شده است و کاربر لاگین نکرده، او را به صفحه لاگین هدایت کن.
    if (isStrictlyProtected && !token) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // ۲. اگر کاربر لاگین کرده است، منطق مربوط به نقش‌ها را اجرا کن.
    if (token) {
        const userRole = token.role as Role;

        // مسیرهای مخصوص استاد و ادمین
        const instructorAdminPaths = [ "/dashboard", "/learning-paths", "/grading", "/browse-courses" ];
        if (userRole === "USER" && instructorAdminPaths.some(p => pathname.startsWith(p))) {
           return NextResponse.redirect(new URL("/my-courses", req.url));
        }

        // مسیرهای مخصوص ادمین
        const adminOnlyPaths = ["/categories", "/admin"];
        if (userRole !== "ADMIN" && adminOnlyPaths.some(p => pathname.startsWith(p))) {
          const redirectUrl = userRole === "INSTRUCTOR" ? "/dashboard" : "/my-courses";
          return NextResponse.redirect(new URL(redirectUrl, req.url));
        }
    }

    // ۳. برای تمام مسیرهای دیگر (مانند صفحه اصلی، کاتالوگ، و مهمتر از همه /courses/.../sections/...)
    // هیچ ریدایرکتی انجام نده و فقط درخواست را به صفحه مورد نظر ارسال کن.
    return addPathnameHeader(req);
}


// --- Config ---
// این اطمینان می‌دهد که میدلور روی همه مسیرها به جز فایل‌های استاتیک و API اجرا می‌شود.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};