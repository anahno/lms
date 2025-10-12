// فایل: components/header.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "./ui/button";

export default function Header() {
  // از هوک useSession برای دسترسی به اطلاعات نشست استفاده می‌کنیم
  const { data: session, status } = useSession();

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b bg-white">
      <div>
        <h2 className="font-semibold">داشبورد</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* وضعیت در حال بارگذاری */}
        {status === "loading" && <p>در حال بارگذاری...</p>}

        {/* اگر کاربر وارد شده بود */}
        {status === "authenticated" && (
          <>
            <span>خوش آمدید، {session.user?.name || session.user?.email}</span>
            <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>
              خروج
            </Button>
          </>
        )}
      </div>
    </header>
  );
}