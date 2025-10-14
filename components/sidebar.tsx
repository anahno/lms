// فایل: components/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookCopy, List } from "lucide-react";
import { cn } from "@/lib/utils";

// آرایه‌ای از مسیرها برای ناوبری
const routes = [
  {
    icon: BookCopy,
    href: "/",
    label: "مسیرهای یادگیری",
  },
  {
    icon: List,
    href: "/categories", // مسیر جدید ما
    label: "دسته‌بندی‌ها",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden border-l md:flex md:flex-col md:w-64 bg-gray-50">
      <div className="flex items-center h-16 px-6 border-b">
        <h1 className="text-lg font-bold">LMS پلتفرم</h1>
      </div>
      <div className="flex flex-col flex-1 p-4">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center p-3 my-1 rounded-lg text-slate-700 hover:bg-slate-200 transition",
              (pathname === route.href || (route.href !== "/" && pathname.startsWith(route.href))) && "bg-sky-200/50 text-sky-700"
            )}
          >
            <route.icon className="h-5 w-5 ml-3" />
            {route.label}
          </Link>
        ))}
      </div>
    </div>
  );
}