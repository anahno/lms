// فایل: app/(public)/instructors/[instructorId]/_components/MentorshipBookingSection.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { User, MentorProfile, TimeSlot, PaymentGatewaySetting } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, Loader2 } from "lucide-react";
import { createMentorshipBooking } from "@/actions/mentorship-actions"; 
import { BookingCalendar } from "./BookingCalendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PaymentGateway } from "@/lib/payment/payment-service";

// تابع جدید برای واکشی درگاه‌های فعال از API
async function getEnabledGateways(): Promise<PaymentGatewaySetting[]> {
    try {
        const res = await fetch('/api/gateways');
        if (!res.ok) return [];
        return res.json();
    } catch (error) {
        console.error("Failed to fetch gateways:", error);
        return [];
    }
}

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
  const [enabledGateways, setEnabledGateways] = useState<PaymentGatewaySetting[]>([]);
  const [isGatewayModalOpen, setGatewayModalOpen] = useState(false);
  const router = useRouter();

  // در زمان بارگذاری کامپوننت، لیست درگاه‌های فعال را دریافت می‌کنیم
  useEffect(() => {
    getEnabledGateways().then(setEnabledGateways);
  }, []);

  const handleSlotToggle = (slotId: string) => {
    setSelectedSlots(prev => 
      prev.includes(slotId)
        ? prev.filter(id => id !== slotId)
        : [...prev, slotId]
    );
  };
  
  // این تابع تصمیم می‌گیرد که آیا مودال را باز کند یا مستقیما به پرداخت برود
  const handleBookingClick = () => {
    if (selectedSlots.length === 0) return;
    
    // اگر فقط یک درگاه فعال بود، بدون نمایش مودال ادامه بده
    if (enabledGateways.length === 1) {
        handleGatewaySelect(enabledGateways[0].gatewayId as PaymentGateway);
    } 
    // اگر بیش از یک درگاه فعال بود، مودال را باز کن
    else if (enabledGateways.length > 1) {
        setGatewayModalOpen(true);
    } 
    // اگر هیچ درگاهی فعال نبود، خطا نمایش بده
    else {
        toast.error("در حال حاضر هیچ درگاه پرداختی فعال نیست. لطفاً با پشتیبانی تماس بگیرید.");
    }
  };

  // این تابع بعد از انتخاب درگاه توسط کاربر، فراخوانی می‌شود
  const handleGatewaySelect = (gatewayId: PaymentGateway) => {
    setGatewayModalOpen(false);
    startTransition(async () => {
      const result = await createMentorshipBooking(selectedSlots, gatewayId);
      if (result && 'success' in result && result.success && result.url) {
        toast.success("در حال انتقال به درگاه پرداخت...");
        window.location.href = result.url;
      } else {
        toast.error(result.error || "خطایی در فرآیند رزرو رخ داد.");
        setSelectedSlots([]);
        router.refresh();
      }
    });
  };
  
  if (isOwner) return null; 

  const totalCost = (mentor.mentorProfile?.hourlyRate || 0) * selectedSlots.length;

  return (
    <>
      {/* مودال انتخاب درگاه پرداخت */}
      <Dialog open={isGatewayModalOpen} onOpenChange={setGatewayModalOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>انتخاب درگاه پرداخت</DialogTitle>
                  <DialogDescription>یکی از درگاه‌های زیر را برای تکمیل پرداخت انتخاب کنید.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                  {enabledGateways.map(gateway => (
                      <Button key={gateway.id} onClick={() => handleGatewaySelect(gateway.gatewayId as PaymentGateway)} className="w-full" size="lg" disabled={isPending}>
                          {isPending ? <Loader2 className="animate-spin" /> : gateway.title}
                      </Button>
                  ))}
              </div>
          </DialogContent>
      </Dialog>
    
      {/* بقیه کامپوننت */}
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
            <h4 className="font-semibold mb-2">۱. بازه‌های زمانی آزاد را انتخاب کنید:</h4>
            <p className="text-sm text-muted-foreground mb-4">
              روی بازه‌های زمانی سبز رنگ در تقویم کلیک کنید تا به سبد خرید شما اضافه شوند.
            </p>
            <BookingCalendar 
              timeSlots={mentor.mentorTimeSlots}
              selectedSlots={selectedSlots}
              onSlotToggle={handleSlotToggle}
            />
          </div>

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
                  disabled={isPending || enabledGateways.length === 0}
                >
                  {isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  {enabledGateways.length > 0 ? "ادامه و پرداخت" : "درگاه پرداختی فعال نیست"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};