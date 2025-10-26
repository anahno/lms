// فایل: app/(public)/my-account/sessions/_components/SessionsClient.tsx
"use client";

import { useState, useEffect, useMemo } from "react"; // +++ ۱. وارد کردن useMemo +++
import Link from "next/link";
import Image from "next/image";
import { Booking, User, TimeSlot } from "@prisma/client";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // --- این‌ها استفاده نشده‌اند ---
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, AlertTriangle } from "lucide-react";
// import { cn } from "@/lib/utils"; // --- این استفاده نشده است ---

type EnrichedBooking = Booking & {
  mentor: Pick<User, "name" | "image">;
  timeSlot: Pick<TimeSlot, "startTime" | "endTime">;
};

interface SessionsClientProps {
  initialBookings: EnrichedBooking[];
}

const BookingCard = ({ booking }: { booking: EnrichedBooking }) => {
  const [isJoinButtonActive, setIsJoinButtonActive] = useState(false);
  
  // +++ ۲. استفاده از useMemo برای بهینه‌سازی +++
  const { startTime, endTime } = useMemo(() => ({
    startTime: new Date(booking.timeSlot.startTime),
    endTime: new Date(booking.timeSlot.endTime),
  }), [booking.timeSlot.startTime, booking.timeSlot.endTime]);

  const now = new Date();
  const isPast = now > endTime;

  useEffect(() => {
    const checkTime = () => {
      const fifteenMinutesBefore = new Date(startTime.getTime() - 15 * 60 * 1000);
      setIsJoinButtonActive(new Date() >= fifteenMinutesBefore && new Date() < endTime);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [startTime, endTime]); // <-- حالا این وابستگی‌ها پایدار هستند

  return (
    <div className="p-4 border rounded-lg bg-white flex flex-col sm:flex-row items-start gap-4">
      <Image
        src={booking.mentor.image || "/images/default-avatar.png"}
        alt={booking.mentor.name || "مدرس"}
        width={60}
        height={60}
        className="rounded-full"
      />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-slate-800">جلسه با {booking.mentor.name}</p>
            <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4" />
              {startTime.toLocaleDateString("fa-IR", { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              ساعت {startTime.toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit' })} تا {endTime.toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Badge variant={isPast ? "secondary" : "success"}>
            {isPast ? "برگزار شده" : "آینده"}
          </Badge>
        </div>
        {!isPast && (
          <div className="pt-3 border-t">
            {booking.meetingLink ? (
              <Button asChild disabled={!isJoinButtonActive} className="w-full sm:w-auto">
                <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer">
                  <Video className="w-4 h-4 ml-2" />
                  ورود به جلسه
                </a>
              </Button>
            ) : (
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-md flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                لینک جلسه هنوز توسط مدرس مشخص نشده است.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const SessionsClient = ({ initialBookings }: SessionsClientProps) => {
  const now = new Date();
  const upcomingBookings = initialBookings.filter(b => new Date(b.timeSlot.endTime) >= now);
  const pastBookings = initialBookings.filter(b => new Date(b.timeSlot.endTime) < now);

  if (initialBookings.length === 0) {
    return (
      <div className="text-center text-muted-foreground mt-10">
        <p>شما هنوز هیچ جلسه مشاوره‌ای رزرو نکرده‌اید.</p>
        <Link href="/courses" className="text-sky-600 hover:underline">
          مشاهده لیست مدرسان و دوره‌ها
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {upcomingBookings.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">جلسات آینده</h2>
          <div className="space-y-4">
            {upcomingBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)}
          </div>
        </section>
      )}

      {pastBookings.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">جلسات گذشته</h2>
          <div className="space-y-4">
            {pastBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)}
          </div>
        </section>
      )}
    </div>
  );
};