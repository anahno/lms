// فایل: app/(dashboard)/admin/users/page.tsx
"use server";

import { db } from "@/lib/db";
import { redirect } from "next/navigation";
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
      <h1 className="text-3xl font-bold mb-6">مدیریت کاربران</h1>
      
      {users.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <p>هیچ کاربری یافت نشد.</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>ایمیل</TableHead>
                <TableHead>نقش</TableHead>
                <TableHead className="text-left">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name || "بی‌نام"}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={roleDisplay[user.role].className}>
                      {roleDisplay[user.role].text}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-left">
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