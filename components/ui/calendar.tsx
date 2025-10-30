// فایل نهایی و تضمینی: components/ui/calendar.tsx
"use client";

import * as React from "react";
// Chevron ها دیگر لازم نیستند چون از آیکون‌های پیش‌فرض استفاده می‌کنیم
import { DayPicker } from "react-day-picker/persian"; // ۱. وارد کردن از مسیر "persian" برای فعال‌سازی گاه‌شماری شمسی
import { faIR } from "date-fns/locale"; // ۲. وارد کردن آبجکت کامل زبان فارسی
import type { Locale } from "date-fns"; // ۳. وارد کردن تایپ Locale برای حل خطای تایپ‌اسکریپت

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      // ۴. پراپرتی locale را با Type Assertion صحیح اضافه می‌کنیم
      // این کار هم برچسب‌ها را فارسی می‌کند و هم خطای بیلد را حل می‌کند
      locale={faIR as Locale}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1", // جهت‌دهی صحیح برای RTL
        nav_button_next: "absolute right-1", // جهت‌دهی صحیح برای RTL
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      // ۵. پراپرتی components که باعث تمام خطاهای قبلی بود، به طور کامل حذف شده است
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };