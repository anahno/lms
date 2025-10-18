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
    
    // ۱. اگر کاربر یک استاد است و تلاش می‌کند به مسیرهای فقط-ادمین برود
    if (userRole === "INSTRUCTOR" && adminOnlyPaths.some(p => pathname.startsWith(p))) {
      // او را به داشبورد خودش هدایت کن
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    // ۲. اگر کاربر یک دانشجو (USER) است و تلاش می‌کند به هرکدام از صفحات مدیریتی برود
    if (userRole === "USER" && (pathname.startsWith("/dashboard") || pathname.startsWith("/learning-paths") || pathname.startsWith("/categories") || pathname.startsWith("/grading"))) {
      // او را به داشبورد دانشجو هدایت کن
      return NextResponse.redirect(new URL("/my-courses", req.url));
    }

    // در غیر این صورت، اجازه دسترسی بده
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  // --- matcher جدید و دقیق‌تر برای محافظت از مسیرهای پنل مدیریت ---
  matcher: [
    "/dashboard/:path*",
    "/learning-paths/:path*",
    "/categories/:path*",
    "/grading/:path*",
  ],
};