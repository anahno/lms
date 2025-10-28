// فایل اصلاح شده نهایی: app/(dashboard)/mentorship/_components/WeeklyScheduler.tsx
"use client";

import { useState, useMemo } from "react";
import { TimeSlot } from "@prisma/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// تعریف پراپ‌های کامپوننت
interface WeeklySchedulerProps {
  timeSlots: TimeSlot[];
  onDelete: (id: string) => void;
  onCreate: (formData: FormData) => void;
}

// داده‌های مربوط به مودال ایجاد اسلات جدید
interface NewSlotData {
  date: Date;
  startTime: string;
  endTime: string;
  title: string;
  color: string;
}

// تابع کمکی برای گرفتن تاریخ شروع هفته (شنبه)
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - (day + 1) % 7; // شنبه = 0
  return new Date(d.setDate(diff));
};

export const WeeklyScheduler = ({ timeSlots, onDelete, onCreate }: WeeklySchedulerProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null);
  const [newSlotData, setNewSlotData] = useState<NewSlotData | null>(null);

  const weekDays = useMemo(() => {
    const start = getStartOfWeek(currentDate);
    return Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  }, [currentDate]);

  const timeLabels = Array.from({ length: 17 }).map((_, i) => `${i + 7}:00`);

  const handleSlotClick = (slot: TimeSlot | null, date: Date, time: string) => {
    if (slot && slot.status === "AVAILABLE") {
      setSlotToDelete(slot.id);
    } else if (!slot && date >= new Date()) {
      const hour = parseInt(time.split(":")[0]);
      const startTime = `${String(hour).padStart(2, '0')}:00`;
      const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
      
      setNewSlotData({ date, startTime, endTime, title: "", color: "#10b981" });
    }
  };
  
  const confirmDelete = () => {
    if (slotToDelete) {
      onDelete(slotToDelete);
      setSlotToDelete(null);
    }
  };

  const confirmCreate = () => {
    if (!newSlotData) return;
    
    const formData = new FormData();
    formData.append("date", newSlotData.date.toISOString().split('T')[0]);
    formData.append("startTime", newSlotData.startTime);
    formData.append("endTime", newSlotData.endTime);
    formData.append("title", newSlotData.title);
    formData.append("color", newSlotData.color);
    
    onCreate(formData);
    setNewSlotData(null);
  };

  const changeWeek = (amount: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + amount * 7);
      return newDate;
    });
  };

  return (
    <>
      <ConfirmModal isOpen={!!slotToDelete} onClose={() => setSlotToDelete(null)} onConfirm={confirmDelete} />
      
      {newSlotData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]" onClick={() => setNewSlotData(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">ایجاد بازه زمانی</h3>
            <div className="space-y-4 mb-6">
              <p className="text-sm"><strong>تاریخ:</strong> {newSlotData.date.toLocaleDateString('fa-IR')} | <strong>ساعت:</strong> {newSlotData.startTime} - {newSlotData.endTime}</p>
              <div className="space-y-2"><Label htmlFor="slotTitle">عنوان (اختیاری)</Label><Input id="slotTitle" value={newSlotData.title} onChange={(e) => setNewSlotData({ ...newSlotData, title: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="slotColor">رنگ</Label><Input id="slotColor" type="color" value={newSlotData.color} onChange={(e) => setNewSlotData({ ...newSlotData, color: e.target.value })} className="h-10 w-20 p-1" /></div>
            </div>
            <div className="flex gap-3 justify-end"><Button variant="ghost" onClick={() => setNewSlotData(null)}>انصراف</Button><Button onClick={confirmCreate}>ایجاد</Button></div>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="icon" onClick={() => changeWeek(-1)}><ChevronRight className="w-5 h-5" /></Button>
          <div className="text-center">
            <p className="font-bold text-lg">{weekDays[0].toLocaleDateString("fa-IR", { month: "long", year: "numeric" })}</p>
            <p className="text-sm text-slate-500">{`${weekDays[0].toLocaleDateString("fa-IR", { day: "numeric" })} - ${weekDays[6].toLocaleDateString("fa-IR", { day: "numeric" })}`}</p>
          </div>
          <Button variant="outline" size="icon" onClick={() => changeWeek(1)}><ChevronLeft className="w-5 h-5" /></Button>
        </div>
        
        <div className="grid grid-cols-[auto_1fr] gap-1 overflow-x-auto">
          <div className="flex flex-col"><div className="h-16"></div>{timeLabels.map(time => (<div key={time} className="h-16 flex items-center justify-center text-xs text-slate-500 font-mono">{time}</div>))}</div>
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
                  const isPast = slotDate < new Date();

                  // +++ شروع اصلاح اصلی +++
                  // استایل داینامیک برای رنگ پس‌زمینه
                  const slotStyle = matchingSlot && matchingSlot.status === "AVAILABLE" && matchingSlot.color
                    ? { backgroundColor: matchingSlot.color, color: '#ffffff', borderColor: 'rgba(0,0,0,0.1)' }
                    : {};
                  // +++ پایان اصلاح اصلی +++

                  return (
                    <div
                      key={time}
                      style={slotStyle} // <-- اعمال استایل داینامیک
                      onClick={() => handleSlotClick(matchingSlot || null, slotDate, time)}
                      className={cn(
                        "h-16 rounded-md transition-all duration-200 text-center p-2 text-xs border",
                        isPast && !matchingSlot ? "bg-slate-100 cursor-not-allowed border-slate-200" : "cursor-pointer",
                        matchingSlot ? {
                          "text-white hover:opacity-90": matchingSlot.status === "AVAILABLE" && matchingSlot.color,
                          "bg-green-500 text-white border-green-600 hover:opacity-90": matchingSlot.status === "AVAILABLE" && !matchingSlot.color,
                          "bg-slate-200 border-slate-300 text-slate-600 cursor-not-allowed": matchingSlot.status === "BOOKED",
                        } : (
                          !isPast && "bg-slate-50 hover:bg-slate-200 border-slate-200"
                        )
                      )}
                    >
                      {matchingSlot?.title && <p className="font-semibold truncate">{matchingSlot.title}</p>}
                      {matchingSlot?.status === "BOOKED" && <p>رزرو شده</p>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};