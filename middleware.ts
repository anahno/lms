// فایل: middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    const userRole = token?.role;

    // مسیرهایی که فقط ادمین به آنها دسترسی دارد
    const adminOnlyPaths = ["/categories"];
    
    // مسیرهای داشبورد کلی (برای استاد و ادمین)
    const dashboardPaths = ["/", "/learning-paths"];

    // ۱. اگر کاربر یک استاد است و تلاش می‌کند به مسیرهای فقط-ادمین برود
    if (userRole === "INSTRUCTOR" && adminOnlyPaths.some(p => pathname.startsWith(p))) {
      // او را به داشبورد خودش (صفحه اصلی) هدایت کن
      return NextResponse.redirect(new URL("/", req.url));
    }
    
    // ۲. اگر کاربر یک دانشجو است و تلاش می‌کند به هرکدام از صفحات مدیریتی/استادی برود
    const isTryingToAccessDashboard = dashboardPaths.some(p => pathname.startsWith(p) && (p === "/" ? pathname.length === 1 : true));
    const isTryingToAccessAdminPages = adminOnlyPaths.some(p => pathname.startsWith(p));
    
    if (userRole === "USER" && (isTryingToAccessDashboard || isTryingToAccessAdminPages)) {
      // او را به داشبورد دانشجو هدایت کن
      return NextResponse.redirect(new URL("/my-courses", req.url));
    }

    // در غیر این صورت، اجازه دسترسی بده
    return NextResponse.next();
  },
  {
    callbacks: {
      // فقط چک می‌کند که کاربر لاگین کرده باشد. منطق اصلی در تابع بالا است.
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  // ما نمی‌خواهیم middleware روی صفحات عمومی مثل /courses اعمال شود
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register|courses).*)"],
};