// فایل: app/(dashboard)/admin/users/_components/UserActions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import { User, Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator, // ۱. Separator را وارد می‌کنیم
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash, Users } from "lucide-react";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

interface UserActionsProps {
  user: User;
}

export const UserActions = ({ user }: UserActionsProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onRoleChange = async (newRole: Role) => {
    if (user.role === newRole) return;
    setIsLoading(true);
    try {
      await axios.patch(`/api/admin/users/${user.id}`, { role: newRole });
      toast.success(`نقش کاربر به ${newRole === 'INSTRUCTOR' ? 'استاد' : 'دانشجو'} تغییر یافت.`);
      router.refresh();
    } catch {
      toast.error("مشکلی در تغییر نقش پیش آمد.");
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    setIsLoading(true);
    try {
      await axios.delete(`/api/admin/users/${user.id}`);
      toast.success("کاربر با موفقیت حذف شد.");
      router.refresh();
    } catch {
      toast.error("مشکلی در حذف کاربر پیش آمد.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ۲. دکمه حذف جداگانه حذف و منطق آن با منو ادغام شد
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
                <span className="sr-only">باز کردن منو</span>
                <MoreHorizontal className="h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRoleChange(Role.INSTRUCTOR)} disabled={user.role === Role.INSTRUCTOR}>
                {/* ۳. آیکون به سمت راست متن منتقل شد */}
                <Users className="h-4 w-4 mr-2" />
                ارتقا به استاد
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRoleChange(Role.USER)} disabled={user.role === Role.USER}>
                <Users className="h-4 w-4 mr-2" />
                تنزل به دانشجو
            </DropdownMenuItem>
            
            {/* ۴. یک خط جداکننده برای زیبایی بیشتر اضافه شد */}
            <DropdownMenuSeparator />

            {/* ۵. گزینه حذف به داخل منو منتقل شد */}
            <ConfirmModal onConfirm={onDelete}>
              <DropdownMenuItem
                // برای جلوگیری از بسته شدن منو هنگام کلیک
                onSelect={(e) => e.preventDefault()}
                className="text-red-600 focus:text-red-600 focus:bg-red-100"
              >
                  <Trash className="h-4 w-4 mr-2" />
                  حذف کاربر
              </DropdownMenuItem>
            </ConfirmModal>

        </DropdownMenuContent>
    </DropdownMenu>
  );
};