// فایل نهایی و تضمینی: app/(dashboard)/mentorship/_components/MentorshipCalendar.tsx
"use client";

import { useMemo, CSSProperties } from "react"; // ۱. CSSProperties را از React وارد کنید
import { TimeSlot } from "@prisma/client";
import { Calendar, Views, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { faIR } from "date-fns/locale";

const locales = { "fa-IR": faIR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: faIR }),
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: TimeSlot;
}

interface MentorshipCalendarProps {
  timeSlots: TimeSlot[];
  onSelectSlot: (slotInfo: { start: Date; end: Date }) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

export const MentorshipCalendar = ({
  timeSlots,
  onSelectSlot,
  onSelectEvent,
}: MentorshipCalendarProps) => {
  const events = useMemo(() => {
    return timeSlots.map((slot): CalendarEvent => ({
      id: slot.id,
      title: slot.title || (slot.status === 'BOOKED' ? "رزرو شده" : "آزاد"),
      start: new Date(slot.startTime),
      end: new Date(slot.endTime),
      resource: slot,
    }));
  }, [timeSlots]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status;
    let backgroundColor = "#34d399";
    if (status === 'BOOKED') {
      backgroundColor = "#94a3b8";
    } else if (event.resource.color) {
      backgroundColor = event.resource.color;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "5px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
        // ========== شروع تغییر نهایی و قطعی ==========
        // با Type Assertion به تایپ‌اسکریپت اطمینان می‌دهیم که این مقدار صحیح است
        textAlign: "right" as CSSProperties['textAlign'],
        // ========== پایان تغییر نهایی و قطعی ==========
        padding: "2px 5px",
      },
    };
  };
  
  return (
    <div className="h-[70vh] bg-white p-4 rounded-lg border">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        culture="fa-IR"
        rtl={true}
        selectable
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent}
        defaultView={Views.WEEK}
        views={[Views.WEEK, Views.DAY, Views.MONTH]}
        eventPropGetter={eventStyleGetter}
        messages={{
            next: "بعدی",
            previous: "قبلی",
            today: "امروز",
            month: "ماه",
            week: "هفته",
            day: "روز",
            agenda: "برنامه",
            date: "تاریخ",
            time: "ساعت",
            event: "رویداد",
            noEventsInRange: "هیچ رویدادی در این بازه وجود ندارد.",
        }}
      />
    </div>
  );
};