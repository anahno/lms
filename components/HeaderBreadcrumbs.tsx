// فایل: components/HeaderBreadcrumbs.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, ChevronLeft } from "lucide-react";

interface HeaderBreadcrumbsProps {
  dynamicRoutes?: Record<string, string>; 
}

export const HeaderBreadcrumbs = ({ dynamicRoutes = {} }: HeaderBreadcrumbsProps) => {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  const pathSegments = pathname.split("/").filter(Boolean);

  const segmentLabels: Record<string, string> = {
    "courses": "کاتالوگ دوره‌ها",
    "my-courses": "دوره‌های من",
    "my-account": "حساب کاربری",
    "instructors": "اساتید",
    "results": "نتایج و آمار",
    "quiz": "آزمون",
    "play": "شروع آزمون"
  };

  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = dynamicRoutes[segment] || segmentLabels[segment] || segment;
    return { href, label };
  });

  return (
    // +++ ۱. تغییرات اصلی در این خط اعمال شده است +++
    // text-sm به text-xs تغییر کرد
    // gap-2 به gap-1 تغییر کرد
    // text-slate-600 به text-slate-500 تغییر کرد
    <nav className="hidden md:flex items-center gap-1 text-xs text-slate-500">
      <Link href="/" className="hover:text-sky-600">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronLeft className="h-3 w-3" />

      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <div key={crumb.href} className="flex items-center gap-1">
            {isLast ? (
              // +++ ۲. رنگ متن آیتم آخر کمی ملایم‌تر شد +++
              <span className="font-semibold text-slate-700">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-sky-600 hover:underline">
                {crumb.label}
              </Link>
            )}
            {/* +++ ۳. اندازه آیکون جداکننده کوچک‌تر شد +++ */}
            {!isLast && <ChevronLeft className="h-3 w-3" />}
          </div>
        );
      })}
    </nav>
  );
};