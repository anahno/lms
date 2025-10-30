// فایل: app/(dashboard)/mentorship/_components/ShamsiDatePicker.tsx
"use client";

import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/prime.css";

interface ShamsiDatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  highlightedDays?: Date[];
}

export const ShamsiDatePicker = ({ date, onDateChange, highlightedDays }: ShamsiDatePickerProps) => {
  const handleOnChange = (dateObject: DateObject | DateObject[] | null) => {
    if (dateObject && !Array.isArray(dateObject)) {
      onDateChange(dateObject.toDate());
    } else {
      onDateChange(undefined);
    }
  };

  return (
    <DatePicker
      value={date}
      onChange={handleOnChange}
      calendar={persian}
      locale={persian_fa}
      calendarPosition="bottom-right"
      className="rmdp-prime"
      mapDays={({ date }) => {
        const isHighlighted = highlightedDays?.some(d => d.toDateString() === date.toDate().toDateString());
        if (isHighlighted) return {
          style: { 
            color: "#0ea5e9",
            backgroundColor: "#f0f9ff"
          } 
        };
      }}
      containerStyle={{ width: "100%" }}
      render={(value, openCalendar) => {
        return (
          <input 
            onFocus={openCalendar}
            value={value}
            readOnly
            placeholder="برای انتخاب تاریخ کلیک کنید"
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #e2e8f0",
              borderRadius: "0.375rem",
              fontSize: "0.875rem",
              cursor: "pointer"
            }}
          />
        );
      }}
    />
  );
};