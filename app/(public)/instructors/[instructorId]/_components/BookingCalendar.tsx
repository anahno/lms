// فایل اصلاح شده نهایی: app/(public)/instructors/[instructorId]/_components/BookingCalendar.tsx
"use client";

import { useState, useMemo } from "react";
import { TimeSlot } from "@prisma/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// تعریف پراپ‌های کامپوننت
interface BookingCalendarProps {
  timeSlots: TimeSlot[];
  selectedSlots: string[];
  onSlotToggle: (slotId: string) => void;
}

// تابع کمکی برای گرفتن تاریخ شروع هفته (شنبه)
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  // شنبه به عنوان روز 0 در نظر گرفته می‌شود
  const diff = d.getDate() - (day + 1) % 7;
  return new Date(d.setDate(diff));
};

export const BookingCalendar = ({ timeSlots, selectedSlots, onSlotToggle }: BookingCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekDays = useMemo(() => {
    const start = getStartOfWeek(currentDate);
    return Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  }, [currentDate]);

  const timeLabels = Array.from({ length: 17 }).map((_, i) => `${i + 7}:00`);

  const changeWeek = (amount: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + amount * 7);
      return newDate;
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      {/* هدر تقویم و کنترل‌ها */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={() => changeWeek(-1)}>
          <ChevronRight className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <p className="font-bold text-lg">
            {weekDays[0].toLocaleDateString("fa-IR", { month: "long", year: "numeric" })}
          </p>
          <p className="text-sm text-slate-500">
            {`${weekDays[0].toLocaleDateString("fa-IR", { day: "numeric" })} - ${weekDays[6].toLocaleDateString("fa-IR", { day: "numeric" })}`}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => changeWeek(1)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="grid grid-cols-[auto_1fr] gap-1 overflow-x-auto">
        <div className="flex flex-col">
          <div className="h-16"></div>
          {timeLabels.map(time => (
            <div key={time} className="h-16 flex items-center justify-center text-xs text-slate-500 font-mono">
              {time}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => (
            <div key={day.toISOString()} className="flex flex-col gap-1">
              <div className="h-16 flex flex-col items-center justify-center bg-slate-50 rounded-t-md">
                <p className="text-sm font-semibold">{day.toLocaleDateString("fa-IR", { weekday: "short" })}</p>
                <p className="text-xs text-slate-500">{day.toLocaleDateString("fa-IR", { day: "numeric" })}</p>
              </div>
              {timeLabels.map(time => {
                const hour = parseInt(time.split(":")[0]);
                const slotDate = new Date(day);
                slotDate.setHours(hour, 0, 0, 0);

                const matchingSlot = timeSlots.find(slot => new Date(slot.startTime).getTime() === slotDate.getTime());
                const isSelected = matchingSlot && selectedSlots.includes(matchingSlot.id);

                // +++ شروع اصلاح اصلی +++
                // استایل داینامیک برای رنگ پس‌زمینه (اگر انتخاب نشده باشد)
                const slotStyle = matchingSlot && matchingSlot.status === "AVAILABLE" && matchingSlot.color && !isSelected
                  ? { backgroundColor: matchingSlot.color, color: '#ffffff', borderColor: 'rgba(0,0,0,0.1)' }
                  : {};
                // +++ پایان اصلاح اصلی +++

                return (
                  <div
                    key={time}
                    style={slotStyle} // <-- اعمال استایل داینامیک
                    onClick={() => matchingSlot && matchingSlot.status === 'AVAILABLE' && onSlotToggle(matchingSlot.id)}
                    className={cn(
                      "h-16 rounded-md transition-all duration-200 text-center p-2 text-xs flex flex-col items-center justify-center border",
                      // حالت‌های مختلف بر اساس وضعیت
                      !matchingSlot || matchingSlot.status === 'BOOKED' ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" :
                      isSelected ? "bg-sky-500 text-white border-sky-600 font-bold cursor-pointer" :
                      (matchingSlot.color ? "text-white hover:opacity-90 cursor-pointer" : "bg-green-500 text-white border-green-600 hover:opacity-90 cursor-pointer")
                    )}
                  >
                    {/* +++ شروع اصلاح اصلی: نمایش عنوان و وضعیت +++ */}
                    {matchingSlot?.title && <p className="font-semibold truncate text-xs">{matchingSlot.title}</p>}
                    {matchingSlot?.status === 'AVAILABLE' && <p className={cn("text-sm", matchingSlot.title && "mt-1")}>{isSelected ? 'انتخاب شد' : 'انتخاب'}</p>}
                    {matchingSlot?.status === 'BOOKED' && <p className="text-sm">رزرو شده</p>}
                    {/* +++ پایان اصلاح اصلی +++ */}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};