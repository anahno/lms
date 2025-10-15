// فایل: app/courses/_components/CollapsedSidebar.tsx
"use client";

import { ChevronsLeft } from "lucide-react"; // آیکون برای باز کردن

interface CollapsedSidebarProps {
  onOpen: () => void;
}

export const CollapsedSidebar = ({ onOpen }: CollapsedSidebarProps) => {
  return (
    <div className="hidden md:flex h-full w-20 flex-col items-center justify-between border-l bg-slate-50 py-8">
      <div /> {/* Empty div for spacing */}
      <button
        onClick={onOpen}
        className="p-3 rounded-full bg-slate-200 hover:bg-slate-300 transition"
        aria-label="باز کردن سایدبار"
      >
        <ChevronsLeft className="h-6 w-6 text-slate-700" />
      </button>
      <div /> {/* Empty div for spacing */}
    </div>
  );
};