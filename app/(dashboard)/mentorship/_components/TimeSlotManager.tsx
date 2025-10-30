"use client";

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { TimeSlot } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, PlusCircle, Loader2, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateSlotsForm } from "./CreateSlotsForm";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { deleteTimeSlot } from "@/actions/mentorship-actions";
import { ShamsiDatePicker } from "./ShamsiDatePicker";

interface TimeSlotManagerProps {
  isEnabled: boolean;
}

export const TimeSlotManager = ({ isEnabled }: TimeSlotManagerProps) => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const refetchSlots = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/mentorship/slots");
      setSlots(response.data);
    } catch (error) {
      toast.error("خطا در بارگذاری برنامه‌زمانی.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isEnabled) {
      refetchSlots();
    } else {
      setIsLoading(false);
    }
  }, [isEnabled]);

  const highlightedDays = useMemo(() => {
    return slots.map(slot => new Date(new Date(slot.startTime).setHours(0, 0, 0, 0)));
  }, [slots]);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    refetchSlots();
  };

  const handleDelete = async (slotId: string) => {
    const result = await deleteTimeSlot(slotId);
    if (result.success) {
      toast.success(result.success);
      refetchSlots();
    } else {
      toast.error(result.error || "خطا در حذف بازه زمانی.");
    }
  };

  const filteredSlots = useMemo(() => {
    if (!selectedDay) return [];
    return slots.filter(slot => 
      new Date(slot.startTime).toDateString() === selectedDay.toDateString()
    );
  }, [slots, selectedDay]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-sky-600" />
          مدیریت برنامه‌زمانی
        </CardTitle>
        <CardDescription>
          برای مدیریت یا ایجاد بازه‌های زمانی، یک روز را از تقویم انتخاب کنید.
        </CardDescription>
      </CardHeader>
      <CardContent className={cn("space-y-8", !isEnabled && "pointer-events-none opacity-50")}>
        {!isEnabled && (
          <div className="text-center text-sm text-amber-700 bg-amber-50 p-4 rounded-md mb-6">
            برای مدیریت برنامه‌زمانی، ابتدا قابلیت منتورشیپ را از بخش تنظیمات فعال کنید.
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* تقویم شمسی */}
            <div className="flex flex-col items-center space-y-4 border rounded-lg p-4 bg-slate-50">
              <h4 className="font-semibold text-center">۱. یک روز را انتخاب کنید</h4>
              <div className="w-full">
                <ShamsiDatePicker 
                  date={selectedDay}
                  onDateChange={(date) => {
                    setSelectedDay(date);
                    if (date) setShowCreateForm(true);
                  }}
                  highlightedDays={highlightedDays}
                />
              </div>
            </div>

            {/* محتوای بازه‌های زمانی */}
            <div className="space-y-6">
              {selectedDay ? (
                <div className="animate-in fade-in-50">
                  <h3 className="font-bold mb-3 text-lg border-b pb-2">
                    برنامه‌های روز: {selectedDay.toLocaleDateString('fa-IR')}
                  </h3>

                  <div className="mb-4">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => setShowCreateForm(!showCreateForm)}
                    >
                      <PlusCircle className="w-4 h-4 ml-2" />
                      {showCreateForm ? "بستن فرم ایجاد" : "ایجاد بازه زمانی جدید"}
                    </Button>

                    {showCreateForm && (
                      <CreateSlotsForm 
                        onFormSuccess={handleCreateSuccess} 
                        selectedDate={selectedDay} 
                      />
                    )}
                  </div>

                  <div className="space-y-2 pt-4">
                    <h4 className="text-sm font-semibold text-muted-foreground">
                      بازه‌های موجود:
                    </h4>
                    {filteredSlots.length > 0 ? (
                      filteredSlots.map(slot => {
                        // ✅ استفاده از رنگ سفارشی یا پیش‌فرض
                        const bgColor = slot.status === 'AVAILABLE' 
                          ? (slot.color || '#10b981')
                          : '#cbd5e1';
                        const textColor = slot.status === 'AVAILABLE' ? '#ffffff' : '#475569';
                        
                        console.log(`🎨 Slot ${slot.id}: color=${slot.color}, bgColor=${bgColor}`);
                        
                        return (
                          <div 
                            key={slot.id} 
                            className="p-3 rounded-md text-sm flex justify-between items-center transition-all hover:shadow-md"
                            style={{ 
                              backgroundColor: bgColor,
                              color: textColor,
                              border: `2px solid ${bgColor}`,
                            }}
                          >
                            <div className="flex-1">
                              <span className="font-semibold">
                                {new Date(slot.startTime).toLocaleTimeString('fa-IR', {hour: '2-digit', minute: '2-digit'})} 
                                {' - '}
                                {new Date(slot.endTime).toLocaleTimeString('fa-IR', {hour: '2-digit', minute: '2-digit'})}
                              </span>
                              {slot.title && (
                                <span className="text-xs mr-2 opacity-80">({slot.title})</span>
                              )}
                            </div>
                            {slot.status === 'AVAILABLE' ? (
                              <ConfirmModal onConfirm={() => handleDelete(slot.id)}>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-auto p-1.5 hover:bg-white/20 text-white hover:text-white"
                                >
                                  <Trash className="w-4 h-4" />
                                </Button>
                              </ConfirmModal>
                            ) : (
                              <span className="text-xs font-bold px-2 py-1 bg-white/20 rounded">
                                رزرو شده
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-center text-muted-foreground py-4 border-dashed border-2 rounded-lg mt-2">
                        هیچ بازه‌ای برای این روز ثبت نشده است.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full bg-slate-50 rounded-lg p-8">
                  <CalendarDays className="w-12 h-12 mb-4 text-slate-400" />
                  <p>لطفاً برای مشاهده یا افزودن برنامه‌ها، یک روز را از تقویم انتخاب کنید.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};