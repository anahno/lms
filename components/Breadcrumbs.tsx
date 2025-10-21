"use client";
import Link from "next/link";
import { ChevronLeft, Home } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  href: string;
};

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <div className="mb-8">
      {/* کانتینر با پس‌زمینه و سایه */}
      <div className="bg-gradient-to-l from-slate-50 to-white rounded-xl p-4 shadow-sm border border-slate-200">
        <nav className="flex items-center text-sm flex-wrap gap-2" dir="rtl">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isFirst = index === 0;
            
            return (
              <div key={item.href} className="flex items-center gap-2">
                {/* آیکون خانه برای اولین آیتم */}
                {isFirst && (
                  <div className="p-1.5 bg-sky-100 rounded-lg">
                    <Home className="h-3.5 w-3.5 text-sky-600" />
                  </div>
                )}
                
                {/* لینک */}
                <Link
                  href={item.href}
                  className={`
                    px-3 py-1.5 rounded-lg transition-all duration-200 font-medium
                    ${isLast 
                      ? 'bg-sky-500 text-white shadow-md pointer-events-none' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm'
                    }
                  `}
                >
                  {item.label}
                </Link>
                
                {/* جداکننده */}
                {!isLast && (
                  <div className="flex items-center">
                    <ChevronLeft className="h-4 w-4 text-slate-400" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
      
      {/* خط جداکننده زیبا با گرادیانت */}
      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-l from-slate-300 via-slate-200 to-transparent"></div>
        <div className="flex gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-slate-400"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-slate-300 via-slate-200 to-transparent"></div>
      </div>
    </div>
  );
};