// فایل: app/(dashboard)/mentorship/_components/UpcomingBookingsList.tsx
"use client";

import { useState } from "react";
import { Booking, User, TimeSlot } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck, User as UserIcon, Mail, Link2, Edit } from "lucide-react";

// +++ ۱. وارد کردن مودال جدید +++
import { AddMeetingLinkModal } from "./AddMeetingLinkModal";

type EnrichedBooking = Booking & {
  student: Pick<User, "name" | "email">;
  timeSlot: Pick<TimeSlot, "startTime" | "endTime">;
};

interface UpcomingBookingsListProps {
  initialData: EnrichedBooking[];
}

export const UpcomingBookingsList = ({ initialData }: UpcomingBookingsListProps) => {
  // +++ ۲. State برای مدیریت باز بودن مودال +++
  const [selectedBooking, setSelectedBooking] = useState<EnrichedBooking | null>(null);

  return (
    <>
      {/* +++ ۳. رندر کردن مودال (در حالت مخفی) +++ */}
      {selectedBooking && (
        <AddMeetingLinkModal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          bookingId={selectedBooking.id}
          initialLink={selectedBooking.meetingLink}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>جلسات مشاوره آینده</CardTitle>
          <CardDescription>لیست جلساتی که توسط دانشجویان رزرو شده است.</CardDescription>
        </CardHeader>
        <CardContent>
          {initialData.length > 0 ? (
            <div className="space-y-4">
              {initialData.map(booking => (
                <div key={booking.id} className="p-4 border rounded-lg bg-sky-50">
                  <div className="font-bold text-sky-800 flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5"/>
                    {new Date(booking.timeSlot.startTime).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    ساعت: {new Date(booking.timeSlot.startTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="mt-3 pt-3 border-t text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-slate-500"/>
                      <span>دانشجو: {booking.student.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500"/>
                      <span>ایمیل: {booking.student.email}</span>
                    </div>

                    {/* +++ ۴. دکمه جدید برای مدیریت لینک جلسه +++ */}
                    <div className="pt-2">
                      {booking.meetingLink ? (
                        <div className="flex items-center justify-between gap-2">
                          <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-700 hover:underline flex items-center gap-1 truncate">
                            <Link2 className="w-3 h-3"/>
                            {booking.meetingLink}
                          </a>
                          <Button variant="ghost" size="sm" className="h-auto p-1" onClick={() => setSelectedBooking(booking)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedBooking(booking)}>
                          <Link2 className="w-4 h-4 ml-2"/>
                          افزودن لینک جلسه
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">
              هنوز هیچ جلسه‌ای رزرو نشده است.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
};