// فایل جدید: app/(dashboard)/mentorship/_components/CreateSlotsForm.tsx
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createTimeSlots } from "@/actions/mentorship-actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { Loader2 } from "lucide-react";

// کامپوننت دکمه Submit که وضعیت pending را از useFormStatus می‌خواند
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : "ایجاد بازه‌ها"}
    </Button>
  );
}

interface CreateSlotsFormProps {
  onFormSuccess: () => void;
}

export function CreateSlotsForm({ onFormSuccess }: CreateSlotsFormProps) {
  const [state, formAction] = useFormState(createTimeSlots, null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      onFormSuccess(); // به کامپوننت والد اطلاع می‌دهد که فرم بسته شود
      router.refresh(); // داده‌ها را از سرور رفرش می‌کند
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router, onFormSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="p-4 border rounded-lg bg-slate-50 space-y-4 mb-6"
    >
      <h4 className="font-semibold">افزودن بازه‌های زمانی برای یک روز</h4>
      
      {/* فیلدهای فرم */}
      <div className="space-y-2"><Label htmlFor="title">عنوان (اختیاری)</Label><Input id="title" name="title" className="bg-white" /></div>
      <div className="space-y-2"><Label htmlFor="manualColor">رنگ (اختیاری)</Label><Input id="manualColor" name="color" type="color" defaultValue="#10b981" className="bg-white h-10 w-20 p-1" /></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>تاریخ</Label>
          <JalaliDatePicker date={selectedDate} onDateChange={setSelectedDate} />
          <input type="hidden" name="date" value={selectedDate?.toISOString().split('T')[0] || ''} />
        </div>
        <div className="space-y-2"><Label htmlFor="startTime">از ساعت</Label><Input id="startTime" name="startTime" type="time" required defaultValue="09:00" className="bg-white" /></div>
        <div className="space-y-2"><Label htmlFor="endTime">تا ساعت</Label><Input id="endTime" name="endTime" type="time" required defaultValue="17:00" className="bg-white" /></div>
      </div>
      
      <p className="text-xs text-muted-foreground">💡 مثال: اگر از ساعت 09:00 تا 17:00 انتخاب کنید، 8 بازه زمانی یک ساعته ایجاد می‌شود.</p>
      
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}