// فایل: app/(public)/instructors/[instructorId]/_components/BookingCalendar.tsx
"use client";

import { useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import faLocale from "@fullcalendar/core/locales/fa";
import { TimeSlot } from "@prisma/client";

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
    const isBooked = slot.status === 'BOOKED';
    const isSelected = selectedSlots.includes(slot.id);

    return {
      id: slot.id,
      title: isBooked ? "رزرو شده" : (slot.title || "زمان آزاد"),
      start: new Date(slot.startTime),
      end: new Date(slot.endTime),
     backgroundColor: isSelected ? "#0ea5e9" : (isBooked ? "#e2e8f0" : (slot.color || "#10b981")),
      borderColor: isSelected ? "#0284c7" : (isBooked ? "#94a3b8" : (slot.color || "#059669")),
      classNames: [
        isBooked ? 'cursor-not-allowed fc-event-booked' : 'cursor-pointer',
        'transition-all', 
        'hover:opacity-80'
      ],
      extendedProps: {
        status: slot.status
      }
    };
  });

  return (
    <div className="booking-calendar-container" dir="rtl">
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
          font-size: 0.75rem;
        }
        .booking-calendar-container .fc-event-title {
          font-weight: 600;
        }
        .booking-calendar-container .fc .fc-list-event-title a {
          color: inherit;
        }

        /* ========== شروع کد جدید برای هاشور زدن ========== */
        .booking-calendar-container .fc-event-booked {
          background-color: #e2e8f0; /* رنگ پایه خاکستری روشن */
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 8px,
            rgba(100, 116, 139, 0.4) 8px, /* رنگ خطوط هاشور */
            rgba(100, 116, 139, 0.4) 16px
          );
          border-color: #94a3b8; /* رنگ حاشیه */
          color: #475569 !important; /* رنگ متن */
        }
        /* ========== پایان کد جدید برای هاشور زدن ========== */

        @media (min-width: 768px) {
          .booking-calendar-container .fc .fc-toolbar.fc-header-toolbar {
            flex-direction: row-reverse;
            justify-content: space-between;
          }
          .booking-calendar-container .fc-event-main {
            font-size: 0.8rem;
          }
        }
      `}</style>
      
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
        locale={faLocale}
        firstDay={6}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek,listWeek",
        }}
        initialView="timeGridWeek"
        allDaySlot={false}
        height="auto"
        events={events}
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          if (info.event.extendedProps.status === 'AVAILABLE') {
            onSlotToggle(info.event.id);
          }
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