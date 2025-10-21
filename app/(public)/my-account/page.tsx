// فایل: app/(public)/my-account/page.tsx
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ProfileForm } from "./_components/ProfileForm";
import { PasswordForm } from "./_components/PasswordForm";
import { Role } from "@prisma/client";

export default async function MyAccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return redirect("/login");
  }

  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!user) {
    return redirect("/login");
  }
  
  // بررسی می‌کنیم که آیا کاربر رمز عبور دارد (یعنی با گوگل وارد نشده)
  const isCredentialsUser = !!user.password;
  const isInstructor = user.role === Role.INSTRUCTOR;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">مدیریت حساب کاربری</h1>
      
      <div className="space-y-8">
        {/* کامپوننت فرم پروفایل */}
        <ProfileForm initialData={user} isInstructor={isInstructor} />
        
        {/* فرم تغییر رمز عبور فقط برای کاربرانی که رمز عبور دارند نمایش داده می‌شود */}
        {isCredentialsUser && <PasswordForm />}
      </div>
    </div>
  );
}