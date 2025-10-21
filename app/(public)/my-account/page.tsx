// فایل: app/(public)/my-account/page.tsx
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ProfileForm } from "./_components/ProfileForm";
import { PasswordForm } from "./_components/PasswordForm";
import { Role } from "@prisma/client";

// +++ ۱. کامپوننت جدید را وارد کنید +++
import { GamificationCard } from "./_components/GamificationCard";

export default async function MyAccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return redirect("/login");
  }

  // +++ ۲. کوئری را برای دریافت اطلاعات نشان‌ها به‌روز کنید +++
  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
        badges: {
            include: {
                badge: true,
            },
            orderBy: {
                awardedAt: 'desc'
            }
        }
    }
  });

  if (!user) {
    return redirect("/login");
  }
  
  const isCredentialsUser = !!user.password;
  const isInstructor = user.role === Role.INSTRUCTOR;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">مدیریت حساب کاربری</h1>
      
      <div className="space-y-8">
        {/* +++ ۳. کامپوننت گیمیفیکیشن را اینجا اضافه کنید +++ */}
        <GamificationCard user={user} />
        
        <ProfileForm initialData={user} isInstructor={isInstructor} />
        
        {isCredentialsUser && <PasswordForm />}
      </div>
    </div>
  );
}