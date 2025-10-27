// فایل: components/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BookCopy, 
  FolderTree, // +++ آیکون List با FolderTree جایگزین شد +++
  Edit, 
  Archive, 
  LayoutGrid, 
  MessageSquare,
  Users,
  UserCog,
  User,
  FileDown,
  Award,
    Settings, // <-- ۱. آیکون جدید را وارد کنید

} from "lucide-react"; 
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";

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
    icon: Award,
    href: "/mentorship",
    label: "مدیریت منتورشیپ",
  },
  {
    icon: FileDown, 
    href: "/admin/reports",
    label: "گزارش‌گیری پیشرفته",
    adminOnly: true,
  },
  {
    icon: Users,
    href: "/admin/users",
    label: "مدیریت کاربران",
    adminOnly: true,
  },
  {
    icon: FolderTree, // +++ آیکون جدید در اینجا استفاده شد +++
    href: "/categories",
    label: "دسته‌بندی‌ها",
    adminOnly: true,
  },

  // ========== پایان کد جدید ==========
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
      // ========== شروع کد جدید ==========
  {
    icon: Settings, // <-- ۲. از آیکون جدید استفاده کنید
    href: "/admin/settings",
    label: "تنظیمات درگاه‌های پرداخت",
    adminOnly: true,
  },
];

const accountRoutes = [
    {
        icon: UserCog,
        href: "/my-account",
        label: "حساب کاربری",
    },
    {
        icon: User,
        href: (userId: string) => `/instructors/${userId}`,
        label: "پروفایل عمومی",
        instructorOnly: true,
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
      
      <div className="flex flex-col flex-1 p-4 overflow-y-auto">
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
            {/* +++ کد رنگ به کلاس آیکون اضافه شد +++ */}
            <route.icon className="h-5 w-5 ml-3 text-[#00a7f5]" />
            {route.label}
          </Link>
        ))}

        <div className="mt-auto pt-4 border-t">
            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                تنظیمات
            </h3>
            {accountRoutes
                .filter(route => {
                    if (route.instructorOnly) {
                        return userRole === "INSTRUCTOR";
                    }
                    return true;
                })
                .map((route) => {
                    const href = typeof route.href === 'function' ? route.href(userId || '') : route.href;

                    return (
                        <Link
                            key={route.label}
                            href={href}
                            className={cn(
                            "flex items-center p-3 my-1 rounded-lg text-slate-700 hover:bg-slate-200 transition",
                            pathname === href && "bg-sky-200/50 text-sky-700"
                            )}
                        >
                            {/* +++ کد رنگ به کلاس آیکون اضافه شد +++ */}
                            <route.icon className="h-5 w-5 ml-3 text-[#00a7f5]" />
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