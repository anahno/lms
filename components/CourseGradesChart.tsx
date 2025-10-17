// فایل: components/CourseGradesChart.tsx
"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ChartData {
  chapterTitle: string;
  score: number | null;
}

interface CourseGradesChartProps {
  data: ChartData[];
}

export const CourseGradesChart = ({ data }: CourseGradesChartProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // ==================== شروع تغییرات کلیدی ====================

  // اشکال‌زدایی: داده‌های ورودی را در کنسول مرورگر چاپ می‌کنیم
  console.log("Data received by Chart component:", data);

  // ۱. از یک کلید ساده انگلیسی (scoreValue) برای داده‌های نمودار استفاده می‌کنیم
  const chartData = data.map(item => ({
    name: item.chapterTitle,
    scoreValue: item.score ?? 0, 
  }));

  // ===================== پایان تغییرات کلیدی =====================

  // اگر هنوز در سمت سرور هستیم یا داده‌ای وجود ندارد، چیزی نمایش نده
  if (!isClient) {
    return <div>در حال بارگذاری نمودار...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>نمودار عملکرد بر اساس فصل</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 75 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value?.toLocaleString()}%`} />
              <Legend />
              {/* ۲. از dataKey جدید استفاده می‌کنیم و با پراپرتی `name` لیبل فارسی را به آن می‌دهیم */}
              <Bar dataKey="scoreValue" fill="#38bdf8" name="نمره شما" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};