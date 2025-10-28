// فایل نهایی و قطعی: app/(dashboard)/mentorship/_components/TimeSlotManager.tsx
"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  const [isPending, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showManualForm, setShowManualForm] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // این تابع کلاینت-ساید، Server Action را فراخوانی می‌کند
  const clientAction = async (formData: FormData) => {
    // برای اطمینان از اینکه تاریخ انتخاب شده در کامپوننت به فرم اضافه می‌شود
    if (selectedDate) {
      formData.set("date", selectedDate.toISOString().split('T')[0]);
    }

    startTransition(async () => {
      const result = await createTimeSlots(formData);
      if (result.success) {
        toast.success(result.success);
        setShowManualForm(false); // بستن فرم
        formRef.current?.reset(); // ریست کردن مقادیر فرم
        router.refresh(); // مهم: درخواست داده‌های جدید از سرور
      } else {
        toast.error(result.error || "خطایی رخ داد.");
      }
    });
  };

  const handleDeleteSlot = (id: string) => {
    startTransition(async () => {
      const result = await deleteTimeSlot(id);
      if (result.success) {
        toast.success(result.success);
        router.refresh(); // مهم: درخواست داده‌های جدید از سرور
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
        <div className="mb-6"><Button type="button" variant="outline" onClick={() => setShowManualForm(!showManualForm)} className="w-full"><PlusCircle className="w-4 h-4 mr-2" />{showManualForm ? "بستن فرم ایجاد" : "ایجاد دستی بازه‌های زمانی"}</Button></div>
        {showManualForm && (
          <form
            ref={formRef}
            action={clientAction} // اتصال مستقیم فرم به Server Action از طریق یک تابع کلاینت
            className="p-4 border rounded-lg bg-slate-50 space-y-4 mb-6"
          >
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
        <WeeklyScheduler 
          timeSlots={initialData} // همیشه از داده‌های اولیه که سرور می‌دهد استفاده می‌کند
          onDelete={handleDeleteSlot} 
          onCreate={clientAction} // قابلیت کلیک برای ایجاد نیز همین تابع را فراخوانی می‌کند
        />
      </CardContent>
    </Card>
  );
};