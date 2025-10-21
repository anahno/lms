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
    <div className="flex items-center gap-x-2">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
                    <span className="sr-only">باز کردن منو</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onRoleChange(Role.INSTRUCTOR)} disabled={user.role === Role.INSTRUCTOR}>
                    <Users className="h-4 w-4 ml-2" />
                    ارتقا به استاد
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRoleChange(Role.USER)} disabled={user.role === Role.USER}>
                    <Users className="h-4 w-4 ml-2" />
                    تنزل به دانشجو
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <ConfirmModal onConfirm={onDelete}>
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" disabled={isLoading}>
                <Trash className="w-4 h-4" />
            </Button>
        </ConfirmModal>
    </div>
  );
};