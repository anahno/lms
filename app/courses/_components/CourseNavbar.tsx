// فایل: app/courses/_components/CourseNavbar.tsx
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Role } from "@prisma/client";
import { 
  LogOut, 
  BookOpen, 
  UserCog, 
  LayoutDashboard,
  ChevronLeft
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { LearningPathWithStructure } from "@/lib/types";
import type { BreadcrumbData } from "../[learningPathId]/sections/[sectionId]/layout";

interface CourseNavbarProps {
  learningPath: LearningPathWithStructure;
  progressCount: number;
  children: React.ReactNode;
  breadcrumbData: BreadcrumbData;
}

export const CourseNavbar = ({
  children,
  breadcrumbData,
}: CourseNavbarProps) => {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAdminOrInstructor = user?.role === Role.ADMIN || user?.role === Role.INSTRUCTOR;

  const getInitials = (name?: string | null) => {
    if (!name) return "؟";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    // +++ ۱. ساختار این هدر را دقیقاً شبیه PublicNavbar می‌کنیم +++
    <div className="border-b h-full flex flex-col justify-center bg-white shadow-sm px-4 py-3">
      <div className="flex items-center">
        {children}
        <h1 className="font-semibold text-lg flex-1 text-center md:text-right line-clamp-1">
            {breadcrumbData.courseTitle}
        </h1>
        <div className="flex items-center gap-x-4 ml-auto">
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
                    <span className="hidden md:inline">{user.name}</span>
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
        </div>
      </div>
      
      {/* +++ ۲. Breadcrumb با margin-top در زیر بخش اصلی هدر قرار می‌گیرد +++ */}
      <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 mt-2">
        <Link href={`/courses/${breadcrumbData.courseId}`} className="hover:underline">
            {breadcrumbData.courseTitle}
        </Link>
        <ChevronLeft className="h-3 w-3" />
        <span>{breadcrumbData.chapterTitle}</span>
        <ChevronLeft className="h-3 w-3" />
        <span className="font-semibold text-slate-700">{breadcrumbData.sectionTitle}</span>
      </div>
    </div>
  );
};