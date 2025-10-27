"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, UserCog, Home } from "lucide-react";
import { Role } from "@prisma/client";

export default function Header() {
  const { data: session, status } = useSession();
  const user = session?.user;

  // تابعی برای گرفتن حروف اول نام برای آواتار
  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b bg-white">
      <div>
        <h2 className="font-semibold">Dashboard</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* حالت در حال بارگذاری */}
        {status === "loading" && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
            <div className="h-4 w-24 bg-slate-200 rounded-md animate-pulse" />
          </div>
        )}

        {/* اگر کاربر وارد شده بود */}
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

              {/* ===== لینک به صفحه مدیریت حساب کاربری ===== */}
              <Link href="/my-account">
                <DropdownMenuItem>
                  <UserCog className="w-4 h-4 mr-2" />
                  <span>My Account</span>
                </DropdownMenuItem>
              </Link>
              
              {/* ===== لینک به پروفایل عمومی (فقط برای اساتید) ===== */}
              {user.role === Role.INSTRUCTOR && (
                <Link href={`/instructors/${user.id}`}>
                    <DropdownMenuItem>
                        <User className="w-4 h-4 mr-2" />
                        <span>My Public Profile</span>
                    </DropdownMenuItem>
                </Link>
              )}

              {/* لینک برای بازگشت به صفحه اصلی سایت */}
               <Link href="/">
                <DropdownMenuItem>
                  <Home className="w-4 h-4 mr-2" />
                  <span>Back to Site</span>
                </DropdownMenuItem>
              </Link>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                <LogOut className="w-4 h-4 mr-2 text-red-500" />
                <span className="text-red-500">Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}