// فایل: app/(dashboard)/admin/users/page.tsx
"use server";

import { db } from "@/lib/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserActions } from "./_components/UserActions";
import { Role } from '@prisma/client';

// آبجکت استایل‌دهی نقش‌ها بدون تغییر باقی می‌ماند
const roleDisplay: Record<Role, { text: string; className: string }> = {
    [Role.ADMIN]: { text: "ادمین", className: "bg-red-600" },
    [Role.INSTRUCTOR]: { text: "استاد", className: "bg-sky-600" },
    [Role.USER]: { text: "دانشجو", className: "bg-slate-500" },
};

export default async function UsersPage() {
  const users = await db.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="p-6">
      {/* ========== ۱. اصلاح هدر صفحه ========== */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">مدیریت کاربران</h1>
        {/* اینجا می‌توانید در آینده دکمه "افزودن کاربر جدید" را قرار دهید */}
      </div>
      
      {users.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <p>هیچ کاربری یافت نشد.</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {/* ========== ۲. راست‌چین کردن سرستون‌ها ========== */}
                <TableHead className="text-right">نام</TableHead>
                <TableHead className="text-right">ایمیل</TableHead>
                <TableHead className="text-right">نقش</TableHead>
                <TableHead className="text-center">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-right">
                    {user.name || "بی‌نام"}
                  </TableCell>
                  <TableCell className="text-right">{user.email}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={roleDisplay[user.role].className}>
                      {roleDisplay[user.role].text}
                    </Badge>
                  </TableCell>
                  {/* ========== ۳. وسط‌چین کردن ستون عملیات ========== */}
                  <TableCell className="text-center">
                    <UserActions user={user} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}