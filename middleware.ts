// فایل: middleware.ts

// ما از یک middleware آماده که خود next-auth فراهم کرده استفاده می‌کنیم.
export { default } from "next-auth/middleware";

// تنظیمات Middleware: مشخص می‌کند که این نگهبان روی کدام مسیرها (صفحات) اعمال شود.
export const config = {
  /*
   * این الگو تمام مسیرها را شامل می‌شود، به جز مسیرهایی که با موارد زیر شروع می‌شوند:
   * - api (مسیرهای API)
   * - _next/static (فایل‌های استاتیک)
   * - _next/image (فایل‌های بهینه‌سازی شده تصاویر)
   * - favicon.ico (آیکون سایت)
   * - login (صفحه ورود خودمان)
   */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register).*)"],
};