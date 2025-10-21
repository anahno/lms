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
  Users,
  UserCog, // ۱. آیکون‌های جدید را وارد کنید
  User 
} from "lucide-react"; 
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";

// ۲. مسیرها را به دو گروه تقسیم می‌کنیم: ناوبری اصلی و تنظیمات حساب
const mainRoutes = [
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
    icon: Users,
    href: "/admin/users",
    label: "مدیریت کاربران",
    adminOnly: true,
  },
  {
    icon: List,
    href: "/categories",
    label: "دسته‌بندی‌ها",
    adminOnly: true,
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

// گروه جدید برای تنظیمات حساب
const accountRoutes = [
    {
        icon: UserCog,
        href: "/my-account",
        label: "حساب کاربری",
    },
    {
        icon: User,
        href: (userId: string) => `/instructors/${userId}`, // این مسیر داینامیک است
        label: "پروفایل عمومی",
        instructorOnly: true, // فقط برای اساتید
    }
]

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as Role;
  const userId = session?.user?.id;

  return (
    <div className="hidden border-l md:flex md:flex-col md:w-64 bg-gray-50">
      <div className="flex items-center h-16 px-6 border-b">
        <h1 className="text-lg font-bold">LMS پلتفرم</h1>
      </div>
      
      {/* ۳. سایدبار را به دو بخش تقسیم می‌کنیم */}
      <div className="flex flex-col flex-1 p-4 overflow-y-auto">
        {/* بخش اصلی ناوبری */}
        {mainRoutes
          .filter(route => {
            if (!route.adminOnly) return true;
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

        {/* ۴. جداکننده و بخش تنظیمات حساب در انتهای سایدبار */}
        <div className="mt-auto pt-4 border-t">
            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                تنظیمات
            </h3>
            {accountRoutes
                .filter(route => {
                    // اگر مسیر فقط برای استاد است، نقش کاربر را چک کن
                    if (route.instructorOnly) {
                        return userRole === "INSTRUCTOR";
                    }
                    // در غیر این صورت (مانند "حساب کاربری")، برای همه نمایش بده
                    return true;
                })
                .map((route) => {
                    // برای مسیرهای داینامیک، آدرس را می‌سازیم
                    const href = typeof route.href === 'function' ? route.href(userId || '') : route.href;

                    return (
                        <Link
                            key={route.label} // چون href داینامیک است، از label به عنوان کلید استفاده می‌کنیم
                            href={href}
                            className={cn(
                            "flex items-center p-3 my-1 rounded-lg text-slate-700 hover:bg-slate-200 transition",
                            pathname === href && "bg-sky-200/50 text-sky-700"
                            )}
                        >
                            <route.icon className="h-5 w-5 ml-3" />
                            {route.label}
                        </Link>
                    )
                })
            }
        </div>
      </div>
    </div>
  );
}