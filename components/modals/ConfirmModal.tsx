// فایل: components/modals/ConfirmModal.tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import * as React from 'react';

interface ConfirmModalProps {
  children?: React.ReactNode;
  onConfirm: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const ConfirmModal = ({ children, onConfirm, isOpen, onClose }: ConfirmModalProps) => {
  const content = (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
        <AlertDialogDescription>
          این عمل قابل بازگشت نیست.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onClose}>انصراف</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>ادامه</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  if (children) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
        {content}
      </AlertDialog>
    );
  }

  // حالت کنترل‌شده برای تقویم
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
        {content}
    </AlertDialog>
  );
};