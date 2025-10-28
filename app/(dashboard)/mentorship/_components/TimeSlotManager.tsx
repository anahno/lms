// فایل نهایی و قطعی: app/(dashboard)/mentorship/_components/TimeSlotManager.tsx
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
import { useRouter } from "next/navigation";

interface TimeSlotManagerProps {
  initialData: TimeSlot[];
  isEnabled: boolean;
}

export const TimeSlotManager = ({ initialData, isEnabled }: TimeSlotManagerProps) => {
  const [slots, setSlots] = useState<TimeSlot[]>(initialData);
  const [isPending, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showManualForm, setShowManualForm] = useState(false);
  const router = useRouter();

  const handleCreateSlots = (formData: FormData) => {
    const originalSlots = slots;
    
    const date = formData.get("date") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const title = formData.get("title") as string | null;
    const color = (formData.get("color") as string) || "#10b981";

    if (!date || !startTime || !endTime) {
      toast.error("اطلاعات فرم ناقص است.");
      return;
    }

    const tempSlots: TimeSlot[] = [];
    const [year, month, day] = date.split('-').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startDateTime = new Date(year, month - 1, day, startHour, startMinute);
    const endDateTime = new Date(year, month - 1, day, endHour, endMinute);

    // +++ شروع اصلاح اصلی برای رفع خطای ESLint +++
    let currentSlotStart = startDateTime;
    while (currentSlotStart < endDateTime) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + 60 * 60 * 1000);
      if (currentSlotEnd > endDateTime) break;

      tempSlots.push({
        id: `temp-${Math.random()}`,
        mentorId: "",
        startTime: new Date(currentSlotStart),
        endTime: currentSlotEnd,
        status: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
        title: title || null,
        color: color,
      });
      // متغیر currentSlotStart دوباره مقداردهی می‌شود، پس استفاده از let صحیح است
      currentSlotStart = currentSlotEnd;
    }
    // +++ پایان اصلاح اصلی +++
    
    if (tempSlots.length === 0) {
        toast.error("هیچ بازه زمانی معتبری برای ایجاد یافت نشد.");
        return;
    }
    
    setSlots(prev => [...prev, ...tempSlots].sort((a,b) => a.startTime.getTime() - b.startTime.getTime()));
    setShowManualForm(false);

    startTransition(async () => {
      const result = await createTimeSlots(formData);
      if (result.success) {
        toast.success(result.success);
        router.refresh(); // برای هماهنگی نهایی در پس‌زمینه
      } else {
        toast.error(result.error || "خطا در ایجاد بازه‌ها.");
        setSlots(originalSlots);
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
    const originalSlots = slots;
    setSlots(prev => prev.filter(slot => slot.id !== id));
    
    startTransition(async () => {
      const result = await deleteTimeSlot(id);
      if (result.success) {
        toast.success(result.success);
        router.refresh();
      } else {
        toast.error(result.error || "خطا در حذف بازه.");
        setSlots(originalSlots);
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
        <div className="mb-6"><Button type="button" variant="outline" onClick={() => setShowManualForm(!showManualForm)} className="w-full"><PlusCircle className="w-4 h-4 mr-2" />{showManualForm ? "بستن فرم ایجاد" : "ایجاد دستی بازه‌های زمانی"}</Button></div>
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
        <WeeklyScheduler timeSlots={slots} onDelete={handleDeleteSlot} onCreate={handleCreateSlots} />
      </CardContent>
    </Card>
  );
};