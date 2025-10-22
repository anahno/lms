// فایل: app/(dashboard)/dashboard/_components/CoursesByCategoryChart.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type CoursesByCategory } from "@/actions/get-dashboard-stats";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface CoursesByCategoryChartProps {
  data: CoursesByCategory[];
}

// تعریف یک پالت رنگی جذاب برای نمودار
const COLORS = ["#0ea5e9", "#f97316", "#10b981", "#8b5cf6", "#ec4899", "#f59e0b"];

export const CoursesByCategoryChart = ({ data }: CoursesByCategoryChartProps) => {
  // آماده‌سازی داده‌ها برای نمودار دایره‌ای
  const chartData = data.map(item => ({
    name: item.category,
    value: item._count.learningPaths,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>توزیع دوره‌ها بر اساس دسته‌بندی</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius-lg)",
                  fontFamily: "inherit", // برای استفاده از فونت وزیر
                }}
              />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                innerRadius={60} // این خط نمودار را به شکل دونات درمی‌آورد
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            <p>داده‌ای برای نمایش نمودار وجود ندارد.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};