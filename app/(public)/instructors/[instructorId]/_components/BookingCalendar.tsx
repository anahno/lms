// فایل: app/(public)/instructors/[instructorId]/_components/BookingCalendar.tsx
"use client";

import { useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import faLocale from "@fullcalendar/core/locales/fa";
import { TimeSlot } from "@prisma/client";

// +++ تعریف نوع جدید با color: string | null برای مطابقت با Prisma +++ //
type TimeSlotWithColor = TimeSlot & {
  color: string | null;
};

interface BookingCalendarProps {
  timeSlots: TimeSlotWithColor[];
  selectedSlots: string[];
  onSlotToggle: (slotId: string) => void;
}

export const BookingCalendar = ({ timeSlots, selectedSlots, onSlotToggle }: BookingCalendarProps) => {
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    const handleResize = () => {
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) {
        if (window.innerWidth < 768) {
          if (calendarApi.view.type !== 'listWeek') {
            calendarApi.changeView('listWeek');
          }
        } else {
          if (calendarApi.view.type !== 'timeGridWeek') {
            calendarApi.changeView('timeGridWeek');
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const events = timeSlots.map((slot) => {
    const defaultColor = "#10b981";
    const defaultBorderColor = "#059669";
    // +++ منطق رنگ‌دهی برای null بودن رنگ +++ //
    const slotColor = slot.color || defaultColor;
    const slotBorderColor = slot.color || defaultBorderColor;

    return {
      id: slot.id,
      title: slot.title || "زمان آزاد",
      start: new Date(slot.startTime),
      end: new Date(slot.endTime),
      backgroundColor: selectedSlots.includes(slot.id) ? "#0ea5e9" : slotColor,
      borderColor: selectedSlots.includes(slot.id) ? "#0284c7" : slotBorderColor,
      classNames: ['cursor-pointer', 'transition-all', 'hover:opacity-80'],
    };
  });

  return (
    <div className="booking-calendar-container" dir="rtl">
      {/* استایل‌های سفارشی و ریسپانسیو */}
      <style jsx global>{`
        .booking-calendar-container .fc {
          direction: rtl;
        }
        .booking-calendar-container .fc .fc-toolbar.fc-header-toolbar {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .booking-calendar-container .fc .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 700;
        }
        .booking-calendar-container .fc-event-main {
          font-size: 0.75rem; /* اندازه فونت کوچک‌تر برای موبایل */
        }
        .booking-calendar-container .fc-event-title {
          font-weight: 600;
        }
        .booking-calendar-container .fc .fc-list-event-title a {
          color: inherit; /* ارث‌بری رنگ از رویداد */
        }
        /* استایل‌های مخصوص دسکتاپ */
        @media (min-width: 768px) {
          .booking-calendar-container .fc .fc-toolbar.fc-header-toolbar {
            flex-direction: row-reverse;
            justify-content: space-between;
          }
          .booking-calendar-container .fc-event-main {
            font-size: 0.8rem; /* فونت کمی بزرگتر در دسکتاپ */
          }
        }
      `}</style>
      
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
        locale={faLocale}
        firstDay={6} // شنبه
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek,listWeek", // نماهای موجود
        }}
        initialView="timeGridWeek" // نمای پیش‌فرض
        allDaySlot={false}
        height="auto"
        events={events}
        eventClick={(info) => {
          info.jsEvent.preventDefault(); // جلوگیری از رفتار پیش‌فرض
          onSlotToggle(info.event.id);
        }}
        slotMinTime="07:00:00"
        scrollTime="08:00:00"
        buttonText={{
          today: "امروز",
          week: "هفته",
          list: "برنامه",
        }}
        noEventsText="هیچ زمان آزادی توسط این مدرس ثبت نشده است."
        themeSystem="standard"
        eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
      />
    </div>
  );
};