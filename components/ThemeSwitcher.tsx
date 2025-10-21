// فایل: components/ThemeSwitcher.tsx
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // این useEffect اطمینان حاصل می‌کند که کد فقط در سمت کلاینت اجرا می‌شود
  // و از خطاهای hydration جلوگیری می‌کند.
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // در سمت سرور، هیچ دکمه‌ای رندر نمی‌شود
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === "dark" ? (
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
      )}
    </Button>
  );
}