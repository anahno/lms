// فایل: app/(dashboard)/learning-paths/[learningPathId]/edit/_components/DropOffAnalyticsCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type FunnelStat } from "@/actions/get-dropoff-stats";
import {
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Tooltip,
} from "recharts";
import { useState } from "react";
import { TrendingDown, Users } from "lucide-react";
import { TooltipProps } from 'recharts';
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

interface DropOffAnalyticsCardProps {
  stats: FunnelStat[];
}

// +++ شروع اصلاحات اصلی تایپ +++

// ۱. یک تایپ مشخص برای آیتم‌های داده نمودار ایجاد می‌کنیم
type ChartDataItem = FunnelStat & {
    index: number;
    dropOffCount: number;
    dropOffPercentage: number;
    fill: string;
    prevData: FunnelStat | null;
};

// ۲. تایپ CustomTooltipProps را برای استفاده از تایپ جدید به‌روز می‌کنیم
interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  // به جای 'any'، از تایپ دقیق ChartDataItem استفاده می‌کنیم
  payload?: { payload: ChartDataItem }[];
  active?: boolean;
  maxStudents: number;
}
// +++ پایان اصلاحات اصلی تایپ +++


const CustomTooltip = ({ active, payload, maxStudents }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const prevData = data.prevData;
    let dropOffPercentage = 0;
    let dropOffCount = 0;

    if (prevData && prevData.studentCount > 0) {
      dropOffCount = prevData.studentCount - data.studentCount;
      dropOffPercentage = (dropOffCount / prevData.studentCount) * 100;
    }

    const completionRate = data.index === 0 
      ? 100 
      : ((data.studentCount / maxStudents) * 100).toFixed(1);

    return (
      <div className="bg-slate-900 p-4 rounded-lg shadow-xl border border-slate-700 space-y-2 max-w-xs">
        <p className="font-bold text-white text-sm">{data.sectionTitle}</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-slate-200">
            <span>دانشجویان فعال:</span>
            <span className="font-semibold">{data.studentCount.toLocaleString("fa-IR")}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>درصد تکمیل:</span>
            <span className="font-semibold text-blue-400">{completionRate}%</span>
          </div>
          {prevData && (
            <>
              <div className="border-t border-slate-600 pt-1 mt-1">
                <div className="flex justify-between text-red-400">
                  <span>ریزش:</span>
                  <span className="font-semibold">{dropOffCount.toLocaleString("fa-IR")} نفر</span>
                </div>
                <div className="flex justify-between text-red-300">
                  <span>درصد ریزش:</span>
                  <span className="font-semibold">{dropOffPercentage.toFixed(1)}%</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const DropOffAnalyticsCard = ({ stats }: DropOffAnalyticsCardProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (stats.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-blue-600" />
            </div>
            <CardTitle className="text-lg">تحلیل قیف یادگیری دانشجویان</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              هنوز داده‌ای برای تحلیل در این دوره وجود ندارد
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxStudents = stats[0]?.studentCount || 1;
  
  const chartData: ChartDataItem[] = stats.map((current, index) => {
    const prevStudents = index > 0 ? stats[index - 1].studentCount : current.studentCount;
    const dropOffCount = prevStudents - current.studentCount;
    const dropOffPercentage = prevStudents > 0 ? (dropOffCount / prevStudents) * 100 : 0;

    return {
      ...current,
      index,
      dropOffCount,
      dropOffPercentage,
      fill: `hsl(200, 75%, ${65 - index * 5}%)`,
      prevData: index > 0 ? stats[index - 1] : null,
    };
  });

  const totalDropOff = stats[0].studentCount - stats[stats.length - 1].studentCount;
  const overallDropOffRate = ((totalDropOff / maxStudents) * 100).toFixed(1);

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">تحلیل قیف یادگیری دانشجویان</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.length} مرحله • کل ریزش: {overallDropOffRate}%
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 overflow-x-auto">
        <p className="text-sm text-muted-foreground leading-relaxed">
          این نمودار قیفی نشان می‌دهد چه تعداد از دانشجویان در هر مرحله از بخش‌ها عبور کرده‌اند و کجا بیشترین ریزش اتفاق می‌افتد.
        </p>

        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-6">
          <ResponsiveContainer width="100%" height={500}>
            <FunnelChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
              <Tooltip content={<CustomTooltip maxStudents={maxStudents} />} />
<Funnel
                dataKey="studentCount"
                data={chartData}
                isAnimationActive
                animationDuration={800}
                lastShapeType="triangle"
              >
                <LabelList
                  position="center"
                  fill="#fff"
                  stroke="none"
                  dataKey="studentCount"
                  formatter={(value: unknown) => {
                    const numValue = typeof value === 'number' ? value : Number(value);
                    return isNaN(numValue) ? '' : numValue.toLocaleString("fa-IR");
                  }}
                  style={{ fontSize: "13px", fontWeight: "600" }}
                />
                <LabelList
                  position="right"
                  dataKey="sectionTitle"
                  fill="#1e293b"
                  stroke="none"
                  formatter={(label: unknown) => {
                    const strLabel = String(label);
                    return strLabel.length > 25 ? `${strLabel.substring(0, 25)}...` : strLabel;
                  }}
                  style={{ fontSize: "11px", fontWeight: "500" }}
                  offset={20}
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <p className="text-xs text-blue-600 font-semibold mb-1">شروع دوره</p>
            <p className="text-2xl font-bold text-blue-900">
              {stats[0].studentCount.toLocaleString("fa-IR")}
            </p>
            <p className="text-xs text-blue-600 mt-1">دانشجو</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <p className="text-xs text-green-600 font-semibold mb-1">موفقیت</p>
            <p className="text-2xl font-bold text-green-900">
              {stats[stats.length - 1].studentCount.toLocaleString("fa-IR")}
            </p>
            <p className="text-xs text-green-600 mt-1">
              ({((stats[stats.length - 1].studentCount / maxStudents) * 100).toFixed(1)}%)
            </p>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 border border-red-100">
            <p className="text-xs text-red-600 font-semibold mb-1">ریزش کل</p>
            <p className="text-2xl font-bold text-red-900">
              {totalDropOff.toLocaleString("fa-IR")}
            </p>
            <p className="text-xs text-red-600 mt-1">{overallDropOffRate}%</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="px-4 py-3 text-right text-slate-700 font-semibold">بخش</th>
                  <th className="px-4 py-3 text-center text-slate-700 font-semibold">دانشجویان</th>
                  <th className="px-4 py-3 text-center text-slate-700 font-semibold">ریزش</th>
                  <th className="px-4 py-3 text-center text-slate-700 font-semibold">درصد</th>
                  <th className="px-4 py-3 text-center text-slate-700 font-semibold">تکمیل</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-slate-200 transition-colors ${
                      hoveredIndex === idx ? "bg-blue-50" : "hover:bg-slate-100"
                    }`}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <td className="px-4 py-3 text-slate-900 font-medium truncate max-w-xs">
                      {row.sectionTitle}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {row.studentCount.toLocaleString("fa-IR")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.dropOffCount > 0 ? (
                        <span className="text-red-600 font-semibold">
                          {row.dropOffCount.toLocaleString("fa-IR")}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.dropOffPercentage > 0 ? (
                        <span className="inline-block bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                          {row.dropOffPercentage.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden mx-auto">
                        <div
                          className="bg-blue-500 h-full transition-all"
                          style={{
                            width: `${(row.studentCount / maxStudents) * 100}%`,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {chartData.length > 0 && (
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <p className="text-xs font-semibold text-amber-900 mb-2">💡 نکات کلیدی:</p>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>
                • بیشترین ریزش در بخش{" "}
                <span className="font-semibold">
                  {chartData.reduce((max, curr) => 
                    curr.dropOffPercentage > max.dropOffPercentage ? curr : max
                  ).sectionTitle}
                </span>{" "}
                ({chartData.reduce((max, curr) => 
                    Math.max(max, curr.dropOffPercentage), 0
                  ).toFixed(1)}%)
              </li>
              <li>
                • {((stats[stats.length - 1].studentCount / maxStudents) * 100).toFixed(1)}% دانشجویان تا انتهای دوره ادامه دادند
              </li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};