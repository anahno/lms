// فایل: components/PublicNavbar.tsx
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "./ui/button";
import { LogIn } from "lucide-react";

export const PublicNavbar = () => {
  const { data: session, status } = useSession();

  return (
    <header className="flex items-center justify-between h-20 px-6 md:px-12 bg-white/80 backdrop-blur-lg sticky top-0 z-50 border-b">
      <Link href="/courses">
        <h1 className="text-2xl font-bold text-slate-800">LMS پلتفرم</h1>
      </Link>

      <div className="flex items-center gap-4">
        {status === "authenticated" ? (
          <>
            <Link href="/my-courses">
              <Button>دوره‌های من</Button>
            </Link>
            {/* --- تغییر کلیدی: این دکمه فقط برای استاد و ادمین است --- */}
            {(session.user.role === "ADMIN" || session.user.role === "INSTRUCTOR") && (
              <Link href="/">
                <Button variant="outline">پنل مدیریت</Button>
              </Link>
            )}
          </>
        ) : (
          <Link href="/login">
            <Button>
              <LogIn className="h-4 w-4 ml-2" />
              ورود | ثبت‌نام
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};