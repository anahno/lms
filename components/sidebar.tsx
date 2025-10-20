// فایل: components/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BookCopy, 
  List, 
  Edit, 
  Archive, 
  LayoutGrid, 
  MessageSquare 
} from "lucide-react"; 
import { cn } from "@/lib/utils";

// آرایه کامل و بدون آیتم تکراری
const routes = [
  {
    icon: BookCopy,
    href: "/dashboard",
    label: "مسیرهای یادگیری",
  },
  {
    icon: LayoutGrid,
    href: "/browse-courses",
    label: "فهرست دوره‌ها",
  },
  {
    icon: MessageSquare,
    href: "/qa-center",
    label: "مرکز پرسش و پاسخ",
  },
  {
    icon: List,
    href: "/categories",
    label: "دسته‌بندی‌ها",
  },
  {
    icon: Edit,
    href: "/grading",
    label: "مرکز نمره‌دهی",
  },
  {
    icon: Archive,
    href: "/grading/archive",
    label: "آرشیو نمرات",
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
            key={route.href} // کلید منحصر به فرد از اینجا تامین می‌شود
            href={route.href}
            className={cn(
              "flex items-center p-3 my-1 rounded-lg text-slate-700 hover:bg-slate-200 transition",
              (pathname === route.href || pathname.startsWith(`${route.href}/`)) && "bg-sky-200/50 text-sky-700"
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