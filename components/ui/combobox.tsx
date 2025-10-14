// فایل: components/ui/combobox.tsx
"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup, // <-- این را اضافه می‌کنیم
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// --- تعریف تایپ‌های جدید برای ساختار گروه‌بندی شده ---
interface ComboboxOption {
  label: string;
  value: string;
}

interface GroupedComboboxOptions {
  label: string;
  options: ComboboxOption[];
}

interface ComboboxProps {
  options: GroupedComboboxOptions[];
  value?: string;
  onChange: (value: string) => void;
}

export function Combobox({ options, value, onChange }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  // پیدا کردن لیبل گزینه انتخاب شده در بین تمام گروه‌ها
  const selectedLabel = options
    .flatMap(group => group.options) // همه گزینه‌ها را در یک لیست قرار بده
    .find(option => option.value === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? selectedLabel
            : "یک گزینه انتخاب کنید..."}
          <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="جستجوی گزینه..." />
          <CommandEmpty>گزینه‌ای یافت نشد.</CommandEmpty>
          <CommandList>
            {/* روی هر گروه یک حلقه می‌زنیم */}
            {options.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {/* و روی گزینه‌های داخل هر گروه هم یک حلقه می‌زنیم */}
                {group.options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label} // جستجو بر اساس این مقدار انجام می‌شود
                    onSelect={() => {
                      onChange(option.value === value ? "" : option.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}