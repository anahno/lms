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
  MessageSquare,
  Users // ۱. آیکون Users را برای دکمه مدیریت کاربران وارد کنید
} from "lucide-react"; 
import { cn } from "@/lib/utils";
// ۲. هوک useSession را برای دسترسی به نقش کاربر وارد کنید
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";

// ۳. یک فیلد جدید به نام adminOnly (اختیاری) به آبجکت مسیرها اضافه کنید
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
    icon: Users, // آیکون جدید
    href: "/admin/users", // مسیر جدید
    label: "مدیریت کاربران",
    adminOnly: true, // این مسیر فقط برای ادمین است
  },
  {
    icon: List,
    href: "/categories",
    label: "دسته‌بندی‌ها",
    adminOnly: true, // این مسیر هم فقط برای ادمین است
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
  // ۴. از هوک useSession برای گرفتن اطلاعات کاربر فعلی استفاده کنید
  const { data: session } = useSession();
  const userRole = session?.user?.role as Role;

  return (
    <div className="hidden border-l md:flex md:flex-col md:w-64 bg-gray-50">
      <div className="flex items-center h-16 px-6 border-b">
        <h1 className="text-lg font-bold">LMS پلتفرم</h1>
      </div>
      <div className="flex flex-col flex-1 p-4">
        {/* ۵. قبل از رندر کردن لینک‌ها، آن‌ها را بر اساس نقش کاربر فیلتر کنید */}
        {routes
          .filter(route => {
            // اگر یک مسیر به عنوان "فقط برای ادمین" علامت‌گذاری نشده، همیشه آن را نمایش بده
            if (!route.adminOnly) {
              return true;
            }
            // اگر علامت‌گذاری شده، فقط زمانی نمایش بده که نقش کاربر ادمین باشد
            return userRole === "ADMIN";
          })
          .map((route) => (
          <Link
            key={route.href}
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