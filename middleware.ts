// فایل: middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";

// این تابع برای اضافه کردن pathname به هدر درخواست است
function addPathnameHeader(req: NextRequest) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-next-pathname', req.nextUrl.pathname);
    return NextResponse.next({
        request: {
            headers: requestHeaders,
        }
    });
}

// این بخش اصلی middleware شماست که با next-auth کار می‌کند
const authMiddleware = withAuth(
  function middleware(req) {
    // فقط منطق مربوط به دسترسی‌ها در اینجا باقی می‌ماند
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    const userRole = token?.role as Role;

    const adminOnlyPaths = ["/categories", "/admin"];
    
    if (userRole !== "ADMIN" && adminOnlyPaths.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    const protectedPaths = ["/dashboard", "/learning-paths", "/categories", "/grading", "/browse-courses", "/admin"];
    if (userRole === "USER" && protectedPaths.some(p => pathname.startsWith(p))) {
       return NextResponse.redirect(new URL("/my-courses", req.url));
     }

    // اگر هیچکدام از شرط‌های بالا برقرار نبود، فقط هدر pathname را اضافه کن
    return addPathnameHeader(req);
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // این بخش فقط برای مسیرهای محافظت شده اجرا می‌شود
    },
  }
);


// این تابع اصلی است که توسط Next.js فراخوانی می‌شود
export default function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    
    // لیست مسیرهای محافظت شده
    const protectedPathsMatcher = [
        "/dashboard/:path*",
        "/learning-paths/:path*",
        "/categories/:path*",
        "/grading/:path*",
        "/browse-courses/:path*",
        "/qa-center/:path*",
        "/admin/:path*",
    ];

    // بررسی اینکه آیا مسیر فعلی جزو مسیرهای محافظت شده است یا نه
    const isProtected = protectedPathsMatcher.some(matcher => 
        new RegExp(`^${matcher.replace(/:\w+\*/, '.*')}$`).test(pathname)
    );

    if (isProtected) {
        // اگر مسیر محافظت شده بود، middleware احراز هویت را اجرا کن
        return (authMiddleware as any)(req);
    }

    // اگر مسیر عمومی بود، فقط هدر pathname را اضافه کن و ادامه بده
    return addPathnameHeader(req);
}


export const config = {
  // middleware را برای همه مسیرها اجرا کن
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};