// فایل: app/(dashboard)/mentorship/_components/TimeSlotManager.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { TimeSlot } from "@prisma/client";
// +++ ۱. اکشن‌های سرور را وارد کنید +++
import { deleteTimeSlot, createTimeSlots } from "@/actions/mentorship-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, PlusCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeeklyScheduler } from "./WeeklyScheduler";
import { CreateSlotsForm } from "./CreateSlotsForm";

interface TimeSlotManagerProps {
  initialData: TimeSlot[];
  isEnabled: boolean;
}

export const TimeSlotManager = ({ initialData, isEnabled }: TimeSlotManagerProps) => {
  // +++ ۲. از isPending برای نمایش وضعیت لودینگ استفاده کنید +++
  const [isPending, startTransition] = useTransition();
  const [showManualForm, setShowManualForm] = useState(false);
  const router = useRouter();

  const handleDeleteSlot = (id: string) => {
    startTransition(async () => {
      const result = await deleteTimeSlot(id);
      if (result.success) {
        toast.success(result.success);
        router.refresh(); 
      } else {
        toast.error(result.error || "خطا در حذف بازه.");
      }
    });
  };

  // +++ ۳. یک تابع جدید برای ایجاد بازه زمانی از طریق تقویم ایجاد کنید +++
  const handleCreateSlotFromCalendar = (formData: FormData) => {
    startTransition(async () => {
        // از آنجایی که اکشن createTimeSlots برای استفاده با useFormState طراحی شده،
        // پارامتر اول را null ارسال می‌کنیم.
        const result = await createTimeSlots(null, formData);
        if (result.success) {
            toast.success(result.success);
            router.refresh();
        } else if (result.error) {
            toast.error(result.error);
        }
    });
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarDays className="w-6 h-6 text-sky-600" />مدیریت برنامه‌زمانی</CardTitle>
        <CardDescription>برای ایجاد بازه‌های زمانی از فرم زیر استفاده کنید. برای حذف، روی یک اسلات آزاد در تقویم کلیک کنید.</CardDescription>
      </CardHeader>
      <CardContent className={cn(!isEnabled && "pointer-events-none opacity-50")}>
        {!isEnabled && (<div className="text-center text-sm text-amber-700 bg-amber-50 p-4 rounded-md mb-6">برای مدیریت برنامه‌زمانی، ابتدا قابلیت منتورشیپ را از بخش تنظیمات فعال کنید.</div>)}
        
        <div className="mb-6">
          <Button type="button" variant="outline" onClick={() => setShowManualForm(!showManualForm)} className="w-full">
            <PlusCircle className="w-4 h-4 mr-2" />
            {showManualForm ? "بستن فرم ایجاد" : "ایجاد دستی بازه‌های زمانی"}
          </Button>
        </div>
        
        {showManualForm && (
          <CreateSlotsForm onFormSuccess={() => setShowManualForm(false)} />
        )}
        
        {/* +++ ۴. تابع جدید را به عنوان پراپ onCreate به تقویم پاس دهید +++ */}
        <WeeklyScheduler 
          timeSlots={initialData} 
          onDelete={handleDeleteSlot} 
          onCreate={handleCreateSlotFromCalendar}
        />
      </CardContent>
    </Card>
  );
};