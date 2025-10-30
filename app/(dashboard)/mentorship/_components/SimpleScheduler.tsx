// فایل نهایی و اصلاح شده: app/(dashboard)/mentorship/_components/SimpleScheduler.tsx
"use client";

// ۱. فایل CSS اصلی کتابخانه را وارد می‌کنیم (برای حل مشکل ظاهری)
import "react-day-picker/dist/style.css";

import { DayPicker, DayProps } from "react-day-picker";
import { faIR } from "date-fns/locale"; // ۲. locale صحیح فارسی (faIR) را وارد می‌کنیم
import { TimeSlot } from "@prisma/client";
import { useMemo, CSSProperties } from "react";

interface SimpleSchedulerProps {
  timeSlots: TimeSlot[];
  selectedDay: Date | undefined;
  onDaySelect: (day: Date | undefined) => void;
}

export const SimpleScheduler = ({ timeSlots, selectedDay, onDaySelect }: SimpleSchedulerProps) => {

  const daysWithSlots = useMemo(() => {
    const dates = timeSlots.map(slot => new Date(slot.startTime).setHours(0, 0, 0, 0));
    return [...new Set(dates)].map(ts => new Date(ts));
  }, [timeSlots]);

  const modifiers = {
    hasSlots: daysWithSlots,
  };

  const modifierStyles = {
    hasSlots: {
      position: 'relative' as CSSProperties['position'],
      color: '#0ea5e9',
      fontWeight: 'bold',
    },
  };

  const DayContent = (props: DayProps) => {
    const isSlotDay = daysWithSlots.some(d => d.getTime() === props.day.date.getTime());
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span>{props.day.date.getDate()}</span>
        {isSlotDay && (
          <div className="absolute bottom-1 w-1.5 h-1.5 bg-sky-500 rounded-full"></div>
        )}
      </div>
    );
  };

  return (
    <div className="flex justify-center p-4 border rounded-lg bg-white">
      <DayPicker
        // ۳. از locale صحیح فارسی (faIR) استفاده می‌کنیم
        locale={faIR}
        dir="rtl"
        mode="single"
        selected={selectedDay}
        onSelect={onDaySelect}
        modifiers={modifiers}
        modifiersStyles={modifierStyles}
        components={{ Day: DayContent }}
        // کلاس‌های shadcn برای هماهنگی ظاهری
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_disabled: "text-muted-foreground opacity-50",
        }}
      />
    </div>
  );
};