// فایل: middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client"; // ۱. Role را از پریزما ایمپورت کنید

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    const userRole = token?.role as Role; // ۲. نقش کاربر را با تایپ مشخص دریافت کنید

    // مسیرهایی که فقط ادمین به آنها دسترسی دارد
    const adminOnlyPaths = ["/categories", "/admin"]; // ۳. مسیر /admin را اضافه کنید
    
    // اگر کاربر ادمین نیست و تلاش می‌کند به مسیرهای ادمین برود
    if (userRole !== "ADMIN" && adminOnlyPaths.some(p => pathname.startsWith(p))) {
      // او را به داشبورد خودش هدایت کن
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    // اگر کاربر یک دانشجو (USER) است و تلاش می‌کند به هرکدام از صفحات مدیریتی برود
    const protectedPaths = ["/dashboard", "/learning-paths", "/categories", "/grading", "/browse-courses", "/admin"];
    if (userRole === "USER" && protectedPaths.some(p => pathname.startsWith(p))) {
       return NextResponse.redirect(new URL("/my-courses", req.url));
     }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/learning-paths/:path*",
    "/categories/:path*",
    "/grading/:path*",
    "/browse-courses/:path*",
    "/qa-center/:path*",
    "/admin/:path*", // ۴. مسیر جدید را به matcher اضافه کنید
  ],
};