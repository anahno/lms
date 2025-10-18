// فایل: components/HomePageSearch.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "./ui/button";

export const HomePageSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/courses?search=${searchTerm.trim()}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
      <div className="relative">
        <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 pointer-events-none" />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="دنبال چه دوره‌ای هستید؟ مثلاً: برنامه‌نویسی، طراحی، مدیریت..."
          className="w-full pr-14 pl-32 py-5 rounded-2xl border-2 border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition shadow-lg text-lg"
        />
        <Button 
          type="submit" 
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-xl px-8" 
          size="lg"
        >
          جستجو
        </Button>
      </div>
    </form>
  );
};