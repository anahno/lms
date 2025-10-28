// فایل نهایی: app/(dashboard)/mentorship/_components/TimeSlotManager.tsx
"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { TimeSlot } from "@prisma/client";
import { createTimeSlots, deleteTimeSlot } from "@/actions/mentorship-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarDays, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { WeeklyScheduler } from "./WeeklyScheduler";

interface TimeSlotManagerProps {
  initialData: TimeSlot[];
  isEnabled: boolean;
}

export const TimeSlotManager = ({ initialData, isEnabled }: TimeSlotManagerProps) => {
  // ۱. state محلی برای مدیریت آنی اسلات‌ها
  const [slots, setSlots] = useState<TimeSlot[]>(initialData);
  const [isPending, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showManualForm, setShowManualForm] = useState(false);

  const handleCreateSlots = (formData: FormData) => {
    startTransition(async () => {
      const result = await createTimeSlots(formData);
      // ۲. در صورت موفقیت، state محلی را مستقیماً آپدیت کن
      if (result.success && result.updatedSlots) {
        toast.success(result.success);
        setSlots(result.updatedSlots);
        setShowManualForm(false);
      } else {
        toast.error(result.error || "خطا در ایجاد بازه‌ها.");
      }
    });
  };

  const handleCreateManual = (formData: FormData) => {
    if (!selectedDate) {
      toast.error("لطفاً یک تاریخ انتخاب کنید.");
      return;
    }
    const dateString = selectedDate.toISOString().split('T')[0];
    formData.append("date", dateString);
    handleCreateSlots(formData);
  };

  const handleDeleteSlot = (id: string) => {
    startTransition(async () => {
      const result = await deleteTimeSlot(id);
      // ۳. در صورت موفقیت، state محلی را مستقیماً آپدیت کن
      if (result.success && result.updatedSlots) {
        toast.success(result.success);
        setSlots(result.updatedSlots);
      } else {
        toast.error(result.error || "خطا در حذف بازه.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-sky-600" />
          مدیریت برنامه‌زمانی
        </CardTitle>
        <CardDescription>
          برای ایجاد بازه‌های زمانی از فرم زیر استفاده کنید. برای حذف، روی یک اسلات آزاد در تقویم کلیک کنید.
        </CardDescription>
      </CardHeader>
      <CardContent className={cn(!isEnabled && "pointer-events-none opacity-50")}>
        {!isEnabled && (
          <div className="text-center text-sm text-amber-700 bg-amber-50 p-4 rounded-md mb-6">
            برای مدیریت برنامه‌زمانی، ابتدا قابلیت منتورشیپ را از بخش تنظیمات فعال کنید.
          </div>
        )}

        <div className="mb-6">
          <Button type="button" variant="outline" onClick={() => setShowManualForm(!showManualForm)} className="w-full">
            <PlusCircle className="w-4 h-4 mr-2" />
            {showManualForm ? "بستن فرم ایجاد" : "ایجاد دستی بازه‌های زمانی"}
          </Button>
        </div>

        {showManualForm && (
          <form action={handleCreateManual} className="p-4 border rounded-lg bg-slate-50 space-y-4 mb-6">
            <h4 className="font-semibold">افزودن بازه‌های زمانی برای یک روز</h4>
            <div className="space-y-2"><Label htmlFor="title">عنوان (اختیاری)</Label><Input id="title" name="title" className="bg-white" /></div>
            <div className="space-y-2"><Label htmlFor="manualColor">رنگ (اختیاری)</Label><Input id="manualColor" name="color" type="color" defaultValue="#10b981" className="bg-white h-10 w-20 p-1" /></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>تاریخ</Label><JalaliDatePicker date={selectedDate} onDateChange={setSelectedDate} /></div>
              <div className="space-y-2"><Label htmlFor="startTime">از ساعت</Label><Input id="startTime" name="startTime" type="time" required defaultValue="09:00" className="bg-white" /></div>
              <div className="space-y-2"><Label htmlFor="endTime">تا ساعت</Label><Input id="endTime" name="endTime" type="time" required defaultValue="17:00" className="bg-white" /></div>
            </div>
            <p className="text-xs text-muted-foreground">💡 مثال: اگر از ساعت 09:00 تا 17:00 انتخاب کنید، 8 بازه زمانی یک ساعته ایجاد می‌شود.</p>
            <div className="flex justify-end"><Button type="submit" disabled={isPending || !selectedDate}>{isPending ? "در حال ایجاد..." : "ایجاد بازه‌ها"}</Button></div>
          </form>
        )}

        {/* ۴. state محلی را به کامپوننت فرزند پاس می‌دهیم */}
        <WeeklyScheduler 
          timeSlots={slots} 
          onDelete={handleDeleteSlot}
          onCreate={handleCreateSlots}
        />
      </CardContent>
    </Card>
  );
};