// فایل: middleware.ts
import { withAuth } from "next-auth/middleware";
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

export default withAuth(
  // این تابع فقط برای کاربرانی که لاگین کرده‌اند و به یک صفحه محافظت شده می‌روند، اجرا می‌شود
  function middleware(req) {
    const token = req.nextauth.token;
    const userRole = token?.role as Role;
    const pathname = req.nextUrl.pathname;

    // --- منطق کنترل دسترسی بر اساس نقش (فقط برای کاربران لاگین کرده) ---

    // 1. اگر کاربر USER است، به پنل ادمین/استاد دسترسی نداشته باشد
    const instructorAdminPaths = ["/dashboard", "/learning-paths", "/categories", "/grading", "/browse-courses", "/admin"];
    if (userRole === "USER" && instructorAdminPaths.some(p => pathname.startsWith(p))) {
       return NextResponse.redirect(new URL("/my-courses", req.url));
    }

    // 2. اگر کاربر INSTRUCTOR است، به پنل ادمین دسترسی نداشته باشد
    const adminOnlyPaths = ["/categories", "/admin"];
    if (userRole === "INSTRUCTOR" && adminOnlyPaths.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // اگر هیچکدام از شرط‌های بالا برقرار نبود، فقط هدر را اضافه کن و اجازه عبور بده
    return addPathnameHeader(req);
  },
  {
    callbacks: {
      // این تابع مشخص می‌کند کدام صفحات نیاز به لاگین دارند
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;

        // +++ شروع تغییر کلیدی و نهایی +++
        // لیست مسیرهایی که حتماً و همیشه نیاز به لاگین دارند.
        // مهم: مسیر پخش دوره (/courses/.../sections/...) در این لیست نیست.
        const protectedPaths = [
            "/my-courses",
            "/my-account",
            "/dashboard",
            "/learning-paths",
            "/grading",
            "/qa-center",
            "/admin",
            "/browse-courses",
            "/categories",
        ];
        
        // بررسی می‌کنیم که آیا مسیر فعلی یکی از مسیرهای کاملاً محافظت شده است یا خیر
        const isProtected = protectedPaths.some(p => pathname.startsWith(p));

        // اگر مسیر محافظت شده است، کاربر حتماً باید لاگین کرده باشد
        if (isProtected) {
            return !!token;
        }

        // برای تمام مسیرهای دیگر (مانند صفحه اصلی، کاتالوگ، و مهم‌تر از همه /courses/.../sections/...)
        // همیشه اجازه دسترسی می‌دهیم. منطق قفل بودن محتوا در خود صفحه مدیریت خواهد شد.
        return true;
        // +++ پایان تغییر کلیدی و نهایی +++
      },
    },
    pages: {
        signIn: "/login",
    }
  }
);

// این بخش برای جلوگیری از اجرای middleware روی فایل‌های استاتیک و API است
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};