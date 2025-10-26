// فایل: app/(public)/instructors/[instructorId]/_components/MentorshipBookingSection.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { User, MentorProfile, TimeSlot } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createMentorshipBooking } from "@/actions/mentorship-actions"; 

type MentorWithProfile = User & {
  mentorProfile: MentorProfile | null;
  mentorTimeSlots: TimeSlot[];
};

interface MentorshipBookingSectionProps {
  mentor: MentorWithProfile;
  isOwner: boolean;
}

export const MentorshipBookingSection = ({ mentor, isOwner }: MentorshipBookingSectionProps) => {
  // +++ ۱. state را به آرایه‌ای از ID ها تغییر می‌دهیم +++
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // +++ ۲. تابع برای مدیریت انتخاب/حذف انتخاب بازه‌ها +++
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
      // +++ ۳. آرایه ID ها را به اکشن سرور پاس می‌دهیم +++
      const result = await createMentorshipBooking(selectedSlots);
      
      if (result && 'success' in result && result.success && result.url) {
        toast.success("در حال انتقال به درگاه پرداخت...");
        window.location.href = result.url;
      } else {
        toast.error(result.error || "خطایی در فرآیند رزرو رخ داد.");
        router.refresh();
      }
    });
  };

  const groupedSlots = mentor.mentorTimeSlots.reduce((acc, slot) => {
    const date = new Date(slot.startTime).toLocaleDateString('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  if (isOwner) {
    return null; 
  }

  // +++ ۴. محاسبه هزینه کل +++
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

        <div>
          <h4 className="font-semibold mb-4">۱. بازه‌های زمانی مورد نظر خود را انتخاب کنید:</h4>
          {mentor.mentorTimeSlots.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedSlots).map(([date, slots]) => (
                <div key={date}>
                  <h5 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    {date}
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {slots.map(slot => (
                      <Button
                        key={slot.id}
                        variant="outline"
                        className={cn(
                          "flex items-center gap-2 justify-center h-auto py-2",
                          selectedSlots.includes(slot.id) && "bg-sky-100 border-sky-500 text-sky-800"
                        )}
                        onClick={() => handleSlotToggle(slot.id)}
                      >
                        <Clock className="w-4 h-4" />
                        {`${new Date(slot.startTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })} الی ${new Date(slot.endTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">
              متاسفانه این مدرس در حال حاضر هیچ زمان آزادی برای مشاوره ثبت نکرده است.
            </p>
          )}
        </div>

        {selectedSlots.length > 0 && (
          <div className="pt-6 border-t">
            <h4 className="font-semibold mb-4">۲. تایید و پرداخت</h4>
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg bg-white">
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