// فایل: components/ui/jalali-date-picker.tsx
"use client";

import * as React from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// تبدیل تاریخ میلادی به شمسی
function gregorianToJalali(gYear: number, gMonth: number, gDay: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const jy = gYear <= 1600 ? 0 : 979;
  gYear -= gYear <= 1600 ? 621 : 1600;
  const gy2 = gMonth > 2 ? gYear + 1 : gYear;
  let days = 365 * gYear + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + 
             Math.floor((gy2 + 399) / 400) - 80 + gDay + g_d_m[gMonth - 1];
  const jy2 = jy + 33 * Math.floor(days / 12053);
  days %= 12053;
  let jYear = jy2 + 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jYear += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jMonth = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jDay = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jYear, jMonth, jDay];
}

// تبدیل تاریخ شمسی به میلادی
function jalaliToGregorian(jYear: number, jMonth: number, jDay: number): [number, number, number] {
  const gy = jYear <= 979 ? 621 : 1600;
  jYear -= jYear <= 979 ? 0 : 979;
  const days = 365 * jYear + Math.floor(jYear / 33) * 8 + Math.floor(((jYear % 33) + 3) / 4) + 
               78 + jDay + (jMonth < 7 ? (jMonth - 1) * 31 : (jMonth - 7) * 30 + 186);
  let gYear = gy + 400 * Math.floor(days / 146097);
  let remainingDays = days % 146097;
  if (remainingDays >= 36525) {
    remainingDays--;
    gYear += 100 * Math.floor(remainingDays / 36524);
    remainingDays %= 36524;
    if (remainingDays >= 365) remainingDays++;
  }
  gYear += 4 * Math.floor(remainingDays / 1461);
  remainingDays %= 1461;
  if (remainingDays >= 366) {
    remainingDays--;
    gYear += Math.floor(remainingDays / 365);
    remainingDays %= 365;
  }
  const g_d_m = [0, 31, remainingDays < 60 && !(gYear % 4 === 0 && (gYear % 100 !== 0 || gYear % 400 === 0)) ? 28 : 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gMonth = 0;
  for (let i = 0; i < g_d_m.length; i++) {
    if (remainingDays < g_d_m[i]) {
      gMonth = i;
      break;
    }
    remainingDays -= g_d_m[i];
  }
  return [gYear, gMonth, remainingDays + 1];
}

// تعداد روزهای ماه شمسی
function getJalaliMonthDays(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  // سال کبیسه
  const isLeap = ((year - 979) % 33 % 4) === 0;
  return isLeap ? 30 : 29;
}

// نام ماه‌های شمسی
const jalaliMonths = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

// نام روزهای هفته
const weekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

interface JalaliDatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function JalaliDatePicker({
  date,
  onDateChange,
  placeholder = "انتخاب تاریخ",
  disabled = false,
  className,
}: JalaliDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  
  // تاریخ انتخاب شده به شمسی
  const selectedJalali = date
    ? gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate())
    : null;

  // تاریخ نمایش داده شده در تقویم (ماه و سال جاری)
  const [viewYear, setViewYear] = React.useState(
    selectedJalali ? selectedJalali[0] : gregorianToJalali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())[0]
  );
  const [viewMonth, setViewMonth] = React.useState(
    selectedJalali ? selectedJalali[1] : gregorianToJalali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())[1]
  );

  // محاسبه روزهای ماه
  const getDaysInMonth = () => {
    const daysInMonth = getJalaliMonthDays(viewYear, viewMonth);
    const [gYear, gMonth, gDay] = jalaliToGregorian(viewYear, viewMonth, 1);
    const firstDayOfMonth = new Date(gYear, gMonth - 1, gDay);
    const firstDayWeekday = (firstDayOfMonth.getDay() + 1) % 7; // شنبه = 0

    const days: (number | null)[] = [];
    
    // روزهای خالی قبل از اول ماه
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null);
    }
    
    // روزهای ماه
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handleDateSelect = (day: number) => {
    const [gYear, gMonth, gDay] = jalaliToGregorian(viewYear, viewMonth, day);
    const newDate = new Date(gYear, gMonth - 1, gDay);
    onDateChange?.(newDate);
    setOpen(false);
  };

  const handleMonthChange = (month: string) => {
    setViewMonth(parseInt(month));
  };

  const handleYearChange = (year: string) => {
    setViewYear(parseInt(year));
  };

  const goToPreviousMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const formatDisplayDate = (date: Date) => {
    const [jYear, jMonth, jDay] = gregorianToJalali(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
    return `${jDay} ${jalaliMonths[jMonth - 1]} ${jYear}`;
  };

  // لیست سال‌ها (5 سال گذشته تا 50 سال آینده)
  const currentJalaliYear = gregorianToJalali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())[0];
  const years = Array.from({ length: 56 }, (_, i) => currentJalaliYear - 5 + i);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="ml-2 h-4 w-4" />
          {date ? formatDisplayDate(date) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          {/* انتخاب ماه و سال */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-7 w-7"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <div className="flex gap-2 flex-1">
              <Select value={viewMonth.toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="h-8 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jalaliMonths.map((month, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={viewYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="h-8 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              className="h-7 w-7"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* تقویم */}
          <div>
            {/* هدر روزهای هفته */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className="h-8 w-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* روزهای ماه */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth().map((day, index) => {
                const isSelected =
                  selectedJalali &&
                  day !== null &&
                  selectedJalali[0] === viewYear &&
                  selectedJalali[1] === viewMonth &&
                  selectedJalali[2] === day;

                const isToday = (() => {
                  if (day === null) return false;
                  const today = new Date();
                  const [jYear, jMonth, jDay] = gregorianToJalali(
                    today.getFullYear(),
                    today.getMonth() + 1,
                    today.getDate()
                  );
                  return jYear === viewYear && jMonth === viewMonth && jDay === day;
                })();

                return (
                  <div key={index}>
                    {day !== null ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 font-normal",
                          isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                          isToday && !isSelected && "border border-primary",
                          !isSelected && !isToday && "hover:bg-accent"
                        )}
                        onClick={() => handleDateSelect(day)}
                      >
                        {day}
                      </Button>
                    ) : (
                      <div className="h-8 w-8" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* دکمه امروز */}
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const today = new Date();
                onDateChange?.(today);
                const [jYear, jMonth] = gregorianToJalali(
                  today.getFullYear(),
                  today.getMonth() + 1,
                  today.getDate()
                );
                setViewYear(jYear);
                setViewMonth(jMonth);
                setOpen(false);
              }}
            >
              امروز
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}