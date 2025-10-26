// فایل: components/PublicNavbar.tsx
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { LogIn, LayoutDashboard, User, LogOut, BookOpen, UserCog, Video /* <--- آیکون جدید */ } from "lucide-react"; import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Role } from "@prisma/client";
import { HeaderBreadcrumbs } from "./HeaderBreadcrumbs";

interface PublicNavbarProps {
  dynamicRoutes?: Record<string, string>;
}

export const PublicNavbar = ({ dynamicRoutes }: PublicNavbarProps) => {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAdminOrInstructor = user?.role === Role.ADMIN || user?.role === Role.INSTRUCTOR;

  const getInitials = (name?: string | null) => {
    if (!name) return "؟";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    // +++ ۱. ساختار هدر را برای کنترل بهتر فاصله تغییر می‌دهیم +++
    <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-50 border-b px-6 md:px-12 py-3">
      <div className="flex items-center justify-between">
        <Link href="/">
          <h1 className="text-2xl font-bold text-slate-800">LMS پلتفرم</h1>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/courses">
            <Button variant="ghost">کاتالوگ دوره‌ها</Button>
          </Link>
          {status === "loading" && (
              <div className="h-10 w-24 bg-slate-200 rounded-md animate-pulse" />
          )}
          {status === "authenticated" && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || ""} alt={user.name || ""} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <span>{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-normal text-xs text-slate-500">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/my-courses">
                  <DropdownMenuItem>
                    <BookOpen className="w-4 h-4 ml-2" />
                    <span>دوره‌های من</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/my-account">
                  <DropdownMenuItem>
                    <UserCog className="w-4 h-4 ml-2" />
                    <span>حساب کاربری</span>
                  </DropdownMenuItem>
                </Link>
                {/* +++ این بخش جدید را اضافه کنید +++ */}
<Link href="/my-account/sessions">
  <DropdownMenuItem>
    <Video className="w-4 h-4 ml-2" />
    <span>جلسات مشاوره من</span>
  </DropdownMenuItem>
</Link>
                {user.role === Role.INSTRUCTOR && (
                  <Link href={`/instructors/${user.id}`}>
                      <DropdownMenuItem>
                          <User className="w-4 h-4 ml-2" />
                          <span>پروفایل عمومی من</span>
                      </DropdownMenuItem>
                  </Link>
                )}
                {isAdminOrInstructor && (
                  <Link href="/dashboard">
                    <DropdownMenuItem>
                      <LayoutDashboard className="w-4 h-4 ml-2" />
                      <span>پنل مدیریت</span>
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                  <LogOut className="w-4 h-4 ml-2 text-red-500" />
                  <span className="text-red-500">خروج از حساب</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {status === "unauthenticated" && (
            <Link href="/login">
              <Button>
                <LogIn className="h-4 w-4 ml-2" />
                ورود | ثبت‌نام
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* +++ ۲. Breadcrumbs حالا در یک div جداگانه با margin-top قرار دارد +++ */}
      <div className="mt-2">
        <HeaderBreadcrumbs dynamicRoutes={dynamicRoutes} />
      </div>
    </header>
  );
};