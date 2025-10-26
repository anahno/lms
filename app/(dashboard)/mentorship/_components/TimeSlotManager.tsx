// فایل: app/(dashboard)/mentorship/_components/TimeSlotManager.tsx
"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { TimeSlot } from "@prisma/client";
import { createTimeSlots, deleteTimeSlot } from "@/actions/mentorship-actions";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Trash2, PlusCircle } from "lucide-react";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { cn } from "@/lib/utils";

interface TimeSlotManagerProps {
  initialData: TimeSlot[];
  isEnabled: boolean;
}

export const TimeSlotManager = ({ initialData, isEnabled }: TimeSlotManagerProps) => {
  const [isPending, startTransition] = useTransition();

  const handleCreateSlots = (formData: FormData) => {
    startTransition(async () => {
      const result = await createTimeSlots(formData);
      if (result.success) {
        toast.success(result.success);
      } else {
        toast.error(result.error || "خطا در ایجاد بازه‌ها.");
      }
    });
  };

  const handleDeleteSlot = (id: string) => {
    startTransition(async () => {
      const result = await deleteTimeSlot(id);
      if (result.success) {
        toast.success(result.success);
      } else {
        toast.error(result.error || "خطا در حذف بازه.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>مدیریت برنامه‌زمانی</CardTitle>
        <CardDescription>روزها و ساعت‌هایی که برای جلسه مشاوره در دسترس هستید را مشخص کنید.</CardDescription>
      </CardHeader>
      <CardContent className={cn(!isEnabled && "pointer-events-none opacity-50")}>
        {!isEnabled && (
          <div className="text-center text-sm text-amber-700 bg-amber-50 p-4 rounded-md mb-6">
            برای مدیریت برنامه‌زمانی، ابتدا قابلیت منتورشیپ را از بخش تنظیمات فعال کنید.
          </div>
        )}
        
        <form action={handleCreateSlots} className="p-4 border rounded-lg bg-slate-50 space-y-4 mb-8">
          <h4 className="font-semibold flex items-center gap-2"><PlusCircle className="w-5 h-5 text-sky-600"/> افزودن بازه‌های زمانی جدید</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">تاریخ</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">از ساعت</Label>
              <Input id="startTime" name="startTime" type="time" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">تا ساعت</Label>
              <Input id="endTime" name="endTime" type="time" required />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">سیستم به صورت خودکار این محدوده را به بازه‌های یک ساعته تقسیم می‌کند.</p>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "در حال ایجاد..." : "ایجاد بازه‌ها"}
            </Button>
          </div>
        </form>

        <div>
          <h4 className="font-semibold mb-4">بازه‌های زمانی در دسترس شما</h4>
          {initialData.length > 0 ? (
            <div className="space-y-2">
              {initialData.map(slot => (
                <div key={slot.id} className="flex items-center justify-between p-3 border rounded-md bg-white">
                  <div className="flex items-center gap-4 text-sm font-medium">
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-500" /> {new Date(slot.startTime).toLocaleDateString('fa-IR')}</span>
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-500" /> {new Date(slot.startTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.endTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <ConfirmModal onConfirm={() => handleDeleteSlot(slot.id)}>
                    <Button variant="ghost" size="icon" className="w-8 h-8" disabled={isPending}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </ConfirmModal>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">هنوز هیچ بازه زمانی آزادی ثبت نکرده‌اید.</p>
          )}
        </div>

      </CardContent>
    </Card>
  );
};