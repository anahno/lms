"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import toast from "react-hot-toast";
import { createTimeSlots } from "@/actions/mentorship-actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
  selectedDate: Date;
}

export function CreateSlotsForm({ onFormSuccess, selectedDate }: CreateSlotsFormProps) {
  const [state, formAction] = useActionState(createTimeSlots, null);
  
  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      onFormSuccess();
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state, onFormSuccess]);

  return (
    <form
      action={formAction}
      className="p-4 border rounded-lg bg-slate-50 space-y-4 my-4 animate-in fade-in-50"
    >
      <h4 className="font-semibold">افزودن بازه‌های زمانی برای یک روز</h4>
      
      <div className="space-y-2">
        <Label>تاریخ انتخاب شده</Label>
        <div className="p-2 border rounded-md bg-white text-center font-semibold">
          {selectedDate.toLocaleDateString('fa-IR')}
        </div>
        <input type="hidden" name="date" value={selectedDate.toISOString().split('T')[0]} />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="title">عنوان (اختیاری)</Label>
        <Input id="title" name="title" className="bg-white" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="color">رنگ (اختیاری)</Label>
        <div className="flex items-center gap-2">
          <Input 
            id="color" 
            name="color" 
            type="color" 
            defaultValue="#10b981" 
            className="bg-white h-10 w-20 p-1 cursor-pointer" 
          />
          <span className="text-xs text-muted-foreground">رنگ دلخواه برای نمایش در تقویم</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">از ساعت</Label>
          <Input id="startTime" name="startTime" type="time" required defaultValue="09:00" className="bg-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">تا ساعت</Label>
          <Input id="endTime" name="endTime" type="time" required defaultValue="17:00" className="bg-white" />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">💡 مثال: اگر از ساعت 09:00 تا 17:00 انتخاب کنید، 8 بازه زمانی یک ساعته ایجاد می‌شود.</p>
      
      <div className="flex justify-end border-t pt-4">
        <SubmitButton />
      </div>
    </form>
  );
}