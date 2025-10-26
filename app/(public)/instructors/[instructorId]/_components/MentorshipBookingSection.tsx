// فایل: app/(public)/instructors/[instructorId]/_components/MentorshipBookingSection.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { User, MentorProfile, TimeSlot } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, Loader2 } from "lucide-react";
import { createMentorshipBooking } from "@/actions/mentorship-actions"; 
// +++ وارد کردن کامپوننت تقویم جدید +++
import { BookingCalendar } from "./BookingCalendar";

type MentorWithProfile = User & {
  mentorProfile: MentorProfile | null;
  mentorTimeSlots: TimeSlot[];
};

interface MentorshipBookingSectionProps {
  mentor: MentorWithProfile;
  isOwner: boolean;
}

export const MentorshipBookingSection = ({ mentor, isOwner }: MentorshipBookingSectionProps) => {
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSlotToggle = (slotId: string) => {
    setSelectedSlots(prev => 
      prev.includes(slotId)
        ? prev.filter(id => id !== slotId)
        : [...prev, slotId]
    );
  };

  const handleBookingClick = () => {
    if (selectedSlots.length === 0) return;
    
    startTransition(async () => {
      const result = await createMentorshipBooking(selectedSlots);
      
      if (result && 'success' in result && result.success && result.url) {
        toast.success("در حال انتقال به درگاه پرداخت...");
        window.location.href = result.url;
      } else {
        toast.error(result.error || "خطایی در فرآیند رزرو رخ داد.");
        setSelectedSlots([]); // +++ ریست کردن انتخاب‌ها در صورت خطا
        router.refresh();
      }
    });
  };
  
  if (isOwner) {
    return null; 
  }

  const totalCost = (mentor.mentorProfile?.hourlyRate || 0) * selectedSlots.length;

  return (
    <Card className="mb-12">
      <CardHeader>
        <CardTitle>رزرو جلسه مشاوره خصوصی</CardTitle>
        <CardDescription>با {mentor.name} جلسات آنلاین یک ساعته رزرو کنید.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {mentor.mentorProfile?.mentorshipDescription && (
          <div className="p-4 bg-slate-50 border rounded-lg text-sm text-slate-700 space-y-2">
            <h4 className="font-semibold flex items-center gap-2"><Info className="w-5 h-5 text-sky-600"/> درباره جلسات مشاوره</h4>
            <p>{mentor.mentorProfile.mentorshipDescription}</p>
          </div>
        )}

        {/* +++ جایگزینی لیست قدیمی با تقویم جدید +++ */}
        <div>
          <h4 className="font-semibold mb-2">۱. بازه‌های زمانی آزاد را انتخاب کنید:</h4>
          <p className="text-sm text-muted-foreground mb-4">
            روی بازه‌های زمانی سبز رنگ در تقویم کلیک کنید تا به سبد خرید شما اضافه شوند. در موبایل، تقویم به صورت لیستی نمایش داده می‌شود.
          </p>
          <BookingCalendar 
            timeSlots={mentor.mentorTimeSlots}
            selectedSlots={selectedSlots}
            onSlotToggle={handleSlotToggle}
          />
        </div>

        {/* این بخش بدون تغییر باقی می‌ماند */}
        {selectedSlots.length > 0 && (
          <div className="pt-6 border-t">
            <h4 className="font-semibold mb-4">۲. تایید و پرداخت</h4>
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg bg-white shadow-inner">
              <div>
                <p className="text-sm text-slate-600">
                  شما {selectedSlots.length} جلسه انتخاب کرده‌اید. هزینه کل:
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  {totalCost.toLocaleString('fa-IR')} تومان
                </p>
              </div>
              <Button 
                size="lg" 
                className="mt-4 sm:mt-0 w-full sm:w-auto" 
                onClick={handleBookingClick}
                disabled={isPending}
              >
                {isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                رزرو و پرداخت
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};