// ═══════════════════════════════════════════════════════════════════════════
// 📁 فایل اول: TimeSlotCalendar.tsx
// 📍 مسیر: app/(dashboard)/mentorship/_components/TimeSlotCalendar.tsx
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction"; // DateSelectArg از اینجا حذف شد
import { EventClickArg, EventContentArg, DateSelectArg } from "@fullcalendar/core"; // DateSelectArg به اینجا اضافه شد
import listPlugin from "@fullcalendar/list";
import faLocale from "@fullcalendar/core/locales/fa";
import { TimeSlot } from "@prisma/client";
import { toast } from "react-hot-toast";

interface TimeSlotCalendarProps {
  timeSlots: TimeSlot[];
  onDelete: (id: string) => void;
  onCreate: (date: string, startTime: string, endTime: string) => void;
}

export const TimeSlotCalendar = ({ timeSlots, onDelete, onCreate }: TimeSlotCalendarProps) => {
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);

  // محاسبه آمار
  const availableCount = timeSlots.filter(s => s.status === "AVAILABLE").length;
  const bookedCount = timeSlots.filter(s => s.status === "BOOKED").length;

  const events = timeSlots.map((slot) => {
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    const timeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
    const dateStr = start.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    
    return {
      id: slot.id,
      title: slot.status === "AVAILABLE" ? `✓ آزاد` : `✗ رزرو`,
      start,
      end,
      backgroundColor: slot.status === "AVAILABLE" ? "#10b981" : "#64748b",
      borderColor: slot.status === "AVAILABLE" ? "#059669" : "#475569",
      textColor: "#ffffff",
      extendedProps: {
        status: slot.status,
        tooltip: `${dateStr}\n${timeStr}\nوضعیت: ${slot.status === "AVAILABLE" ? "آزاد" : "رزرو شده"}`,
      },
    };
  });

  const handleEventClick = (info: EventClickArg) => {
    if (info.event.extendedProps.status === "AVAILABLE") {
      setSlotToDelete(info.event.id);
    } else {
      toast.error("نمی‌توانید بازه زمانی رزرو شده را حذف کنید.");
    }
  };

  const handleSelect = (selectInfo: DateSelectArg) => {
    const start = new Date(selectInfo.start);
    const end = new Date(selectInfo.end);
    
    console.log('Selected range:', { start, end }); // برای دیباگ
    
    // بررسی که زمان انتخابی در گذشته نباشد
    const now = new Date();
    if (start < now) {
      toast.error("نمی‌توانید بازه زمانی در گذشته ایجاد کنید.");
      return;
    }
    
    // بررسی که حداقل یک ساعت انتخاب شده باشد
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (diffHours < 1) {
      toast.error("حداقل یک ساعت باید انتخاب کنید.");
      return;
    }
    
    setSelectedRange({ start, end });
    setShowCreateModal(true);
  };

  const confirmCreate = () => {
    if (selectedRange) {
      const { start, end } = selectedRange;
      
      const date = start.toISOString().split('T')[0];
      const startTime = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
      const endTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
      
      onCreate(date, startTime, endTime);
      setShowCreateModal(false);
      setSelectedRange(null);
    }
  };

  const confirmDelete = () => {
    if (slotToDelete) {
      onDelete(slotToDelete);
      setSlotToDelete(null);
    }
  };

  return (
    <>
      {/* مودال حذف */}
      {slotToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSlotToDelete(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">حذف بازه زمانی</h3>
            <p className="text-gray-600 mb-6">آیا از حذف این بازه زمانی اطمینان دارید؟</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSlotToDelete(null)}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                انصراف
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال ایجاد */}
      {showCreateModal && selectedRange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowCreateModal(false); setSelectedRange(null); }}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">ایجاد بازه‌های زمانی</h3>
            <div className="space-y-3 mb-6">
              <p className="text-gray-600">
                <strong>تاریخ:</strong> {selectedRange.start.toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-gray-600">
                <strong>از ساعت:</strong>{' '}
                {selectedRange.start.getHours().toString().padStart(2, '0')}:
                {selectedRange.start.getMinutes().toString().padStart(2, '0')}
                {' '}<strong>تا ساعت:</strong>{' '}
                {selectedRange.end.getHours().toString().padStart(2, '0')}:
                {selectedRange.end.getMinutes().toString().padStart(2, '0')}
              </p>
              <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
                💡 {Math.floor((selectedRange.end.getTime() - selectedRange.start.getTime()) / (1000 * 60 * 60))} بازه زمانی یک ساعته ایجاد خواهد شد.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowCreateModal(false); setSelectedRange(null); }}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                انصراف
              </button>
              <button
                onClick={confirmCreate}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
              >
                ایجاد
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* آمار */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-700 font-medium mb-1">بازه‌های آزاد</div>
            <div className="text-3xl font-bold text-green-900">{availableCount}</div>
          </div>
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 rounded-lg p-4">
            <div className="text-sm text-slate-700 font-medium mb-1">رزرو شده</div>
            <div className="text-3xl font-bold text-slate-900">{bookedCount}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-lg p-4 col-span-2 md:col-span-1">
            <div className="text-sm text-blue-700 font-medium mb-1">مجموع</div>
            <div className="text-3xl font-bold text-blue-900">{timeSlots.length}</div>
          </div>
        </div>

        {/* راهنما */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📌 راهنمای استفاده:</h3>
          <ul className="text-sm text-blue-800 space-y-1.5">
            <li>• برای <strong>ایجاد بازه زمانی</strong>: در نمای هفته/روز، روی ساعت شروع کلیک کنید و تا ساعت پایان بکشید</li>
            <li>• برای <strong>حذف بازه زمانی</strong>: روی بازه زمان آزاد (سبز) کلیک کنید</li>
            <li>• برای <strong>ایجاد چندین بازه برای یک روز</strong>: از دکمه &quot;ایجاد دستی&quot; بالای صفحه استفاده کنید</li>
            <li>• بازه‌های <span className="inline-flex items-center gap-1"><span className="w-3 h-3 bg-green-600 rounded"></span> سبز</span>: زمان آزاد | بازه‌های <span className="inline-flex items-center gap-1"><span className="w-3 h-3 bg-gray-600 rounded"></span> خاکستری</span>: رزرو شده</li>
            <li className="text-amber-700 font-medium">⚠️ نکته: برای انتخاب در تقویم، حتماً در نمای &quot;هفته&quot; یا &quot;روز&quot; باشید</li>
          </ul>
        </div>

        <div className="calendar-container bg-white p-4 rounded-lg border shadow-sm" dir="rtl">
          <style jsx global>{`
            .fc {
              direction: rtl;
            }
            .fc .fc-toolbar.fc-header-toolbar {
              flex-direction: row-reverse;
              margin-bottom: 1.5rem;
            }
            .fc .fc-toolbar-title {
              font-size: 1.25rem;
              font-weight: 700;
              color: #1e293b;
            }
            .fc .fc-button-primary {
              background-color: #0ea5e9;
              border-color: #0ea5e9;
              padding: 0.5rem 1rem;
              font-weight: 600;
            }
            .fc .fc-button-primary:hover {
              background-color: #0284c7;
              border-color: #0284c7;
            }
            .fc .fc-button-active {
              background-color: #0369a1 !important;
              border-color: #0369a1 !important;
            }
            .fc-event {
              cursor: pointer;
              border-radius: 6px;
              padding: 4px 6px;
              font-size: 0.75rem;
              font-weight: 600;
              transition: all 0.2s ease;
            }
            .fc-event:hover {
              transform: scale(1.02);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            }
            .fc-v-event {
              border-width: 2px !important;
            }
            .fc-timegrid-event-harness {
              margin-bottom: 2px;
            }
            .fc-event-title {
              font-weight: 700;
            }
            .fc-highlight {
              background-color: rgba(14, 165, 233, 0.15) !important;
              border: 2px dashed #0ea5e9 !important;
            }
            .fc-timegrid-slot {
              height: 3rem;
            }
            .fc-col-header-cell {
              padding: 0.75rem 0.5rem;
              font-weight: 600;
              background-color: #f8fafc;
            }
            .fc-scrollgrid {
              border-color: #e2e8f0 !important;
            }
            .fc-theme-standard td, .fc-theme-standard th {
              border-color: #e2e8f0;
            }
            .fc-daygrid-day-number {
              padding: 0.5rem;
              font-weight: 600;
            }
            .fc-timegrid-slot-label {
              font-size: 0.875rem;
              font-weight: 500;
            }
          `}</style>

          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
              center: "title",
              right: "today prev,next",
            }}
            locale={faLocale}
            firstDay={6}
            allDaySlot={false}
            height="auto"
            events={events}
            eventClick={handleEventClick}
            select={handleSelect}
            selectable={true}
            selectMirror={true}
            selectMinDistance={5}
            selectOverlap={false}
            nowIndicator={true}
            slotMinTime="06:00:00"
            slotMaxTime="24:00:00"
            slotDuration="01:00:00"
            snapDuration="01:00:00"
            scrollTime="08:00:00"
            buttonText={{
              today: "امروز",
              month: "ماه",
              week: "هفته",
              day: "روز",
              list: "لیست",
            }}
            noEventsText="هیچ بازه زمانی برای نمایش وجود ندارد"
            themeSystem="standard"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
            selectConstraint={{
              start: '00:00',
              end: '24:00',
            }}
            eventContent={(arg: EventContentArg) => {
              const start = arg.event.start;
              const end = arg.event.end;
              if (!start || !end) return null;
              
              const timeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
              
              return (
                <div className="fc-event-main-frame" title={arg.event.extendedProps.tooltip as string}>
                  <div className="fc-event-title-container">
                    <div className="fc-event-title fc-sticky font-semibold">
                      {arg.event.title}
                    </div>
                    <div className="text-[10px] opacity-90 mt-0.5">
                      {timeStr}
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </div>
      </div>
    </>
  );
};
