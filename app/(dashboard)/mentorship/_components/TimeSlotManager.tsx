// فایل نهایی و قطعی: app/(dashboard)/mentorship/_components/TimeSlotManager.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { TimeSlot } from "@prisma/client";
import { deleteTimeSlot } from "@/actions/mentorship-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeeklyScheduler } from "./WeeklyScheduler";
import { CreateSlotsForm } from "./CreateSlotsForm";

interface TimeSlotManagerProps {
  initialData: TimeSlot[];
  isEnabled: boolean;
}

export const TimeSlotManager = ({ initialData, isEnabled }: TimeSlotManagerProps) => {
  // +++ شروع اصلاح اصلی: isPending حذف شد +++
  const [, startTransition] = useTransition();
  // +++ پایان اصلاح اصلی +++
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
        
        <WeeklyScheduler 
          timeSlots={initialData} 
          onDelete={handleDeleteSlot} 
          onCreate={() => { /* onCreate is now handled by the dedicated form */ }}
        />
      </CardContent>
    </Card>
  );
};