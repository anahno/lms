"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search, X, ChevronDown } from "lucide-react"; // ۱. آیکون ChevronDown را اضافه کنید
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


type CategoryWithSubcategories = Category & { subcategories: Category[] };

interface FiltersProps {
  categories: CategoryWithSubcategories[];
  searchParams: {
    search?: string;
    category?: string;
    level?: string;
    price?: string;
    sortBy?: string;
  }
}

const levelLabels = {
  BEGINNER: "مقدماتی",
  INTERMEDIATE: "متوسط",
  ADVANCED: "پیشرفته",
  ALL_LEVELS: "همه سطوح"
};

export const Filters = ({ categories, searchParams }: FiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(searchParams.search || "");

  // ۲. State جدید برای مدیریت دسته‌بندی‌های باز شده
  // این تابع والد دسته‌بندی فعال را پیدا می‌کند تا به صورت پیش‌فرض باز باشد
  const findParentOfActiveCategory = () => {
    const activeCategoryId = searchParams.category;
    if (!activeCategoryId) return [];
    const parent = categories.find(cat => 
        cat.subcategories.some(sub => sub.id === activeCategoryId)
    );
    return parent ? [parent.id] : [];
  };

  const [expandedCategories, setExpandedCategories] = useState<string[]>(findParentOfActiveCategory());

  // تابع برای باز و بسته کردن یک دسته‌بندی
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
        prev.includes(categoryId)
            ? prev.filter(id => id !== categoryId)
            : [...prev, categoryId]
    );
  };


  useEffect(() => {
    setSearchValue(searchParams.search || "");
  }, [searchParams.search]);

  const updateUrl = (key: string, value: string | null) => {
    const current = new URLSearchParams(Array.from(currentSearchParams.entries()));
    
    if (value === null || value === "") {
      current.delete(key);
    } else {
      current.set(key, value);
    }
    
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl("search", searchValue);
  };
  
  const clearFilters = () => {
      router.push(pathname);
  };


  return (
    <div className="sticky top-24 space-y-6">
        <div className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
            <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder="جستجو در دوره‌ها..."
                        className="pr-10"
                    />
                </div>
            </form>
            <div>
                <h4 className="font-semibold mb-2 text-sm">مرتب‌سازی بر اساس</h4>
                <Select onValueChange={(value) => updateUrl('sortBy', value)} defaultValue={searchParams.sortBy || 'newest'}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">جدیدترین</SelectItem>
                        <SelectItem value="popular">محبوب‌ترین</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-3 pt-2">
                 <h4 className="font-semibold text-sm">فیلترها</h4>
                <div className="flex gap-2">
                    <Button onClick={() => updateUrl('price', 'free')} variant={searchParams.price === 'free' ? 'secondary' : 'outline'} className="flex-1">رایگان</Button>
                    <Button onClick={() => updateUrl('price', 'paid')} variant={searchParams.price === 'paid' ? 'secondary' : 'outline'} className="flex-1">پولی</Button>
                </div>
                 <Select onValueChange={(value) => updateUrl('level', value)} defaultValue={searchParams.level || 'ALL_LEVELS'}>
                    <SelectTrigger>
                        <SelectValue placeholder="سطح دوره" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(levelLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <Button variant="ghost" onClick={clearFilters} className="w-full text-red-600 hover:text-red-700">
                <X className="w-4 h-4 ml-2" />
                حذف همه فیلترها
            </Button>
        </div>

        {/* ==================== شروع تغییرات اصلی در این بخش ==================== */}
        <div className="p-4 border rounded-lg bg-white shadow-sm">
            <h3 className="text-lg font-bold mb-2">دسته‌بندی‌ها</h3>
            <div className="flex flex-col gap-y-1">
                <Button onClick={() => updateUrl('category', null)} variant="ghost" className={cn("w-full justify-start font-semibold", !searchParams.category && "bg-sky-100 text-sky-800")}>
                  همه دوره‌ها
                </Button>
                {categories.map(cat => {
                    const isExpanded = expandedCategories.includes(cat.id);
                    return (
                        <div key={cat.id} className="py-1">
                            {/* ۳. تگ p به button تبدیل شده و استایل‌های جدید گرفته */}
                            <button
                                onClick={() => toggleCategory(cat.id)}
                                className="w-full flex justify-between items-center font-bold text-slate-800 p-2 text-right hover:bg-slate-50 rounded-md transition-colors"
                            >
                                <span>{cat.name}</span>
                                {/* ۴. آیکون + یا همان فلش اضافه شده */}
                                <ChevronDown className={cn("w-5 h-5 text-slate-500 transition-transform", isExpanded && "rotate-180")} />
                            </button>
                            
                            {/* ۵. زیرمجموعه‌ها فقط در صورت باز بودن نمایش داده می‌شوند */}
                            {isExpanded && (
                                <div className="flex flex-col gap-y-1 pr-4 pt-2 border-r-2 mr-4 mt-1">
                                {cat.subcategories.map(sub => (
                                    <Button
                                    key={sub.id}
                                    onClick={() => updateUrl('category', sub.id)}
                                    variant="ghost"
                                    className={cn("w-full justify-start", searchParams.category === sub.id && "bg-sky-100 text-sky-800")}
                                    >
                                    {sub.name}
                                    </Button>
                                ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
        {/* ===================== پایان تغییرات اصلی در این بخش ===================== */}
    </div>
  );
};