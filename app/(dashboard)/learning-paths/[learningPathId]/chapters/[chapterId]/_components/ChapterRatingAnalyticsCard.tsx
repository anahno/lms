// فایل: .../_components/ChapterRatingAnalyticsCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ChapterRatingAnalyticsCardProps {
  ratings: (number | null)[];
}

export const ChapterRatingAnalyticsCard = ({ ratings }: ChapterRatingAnalyticsCardProps) => {
  const validRatings = ratings.filter((r): r is number => r !== null && r >= 1 && r <= 5);
  const totalRatings = validRatings.length;
  
  if (totalRatings === 0) {
    return (
        <Card className="mt-6 bg-slate-100 border-slate-200">
            <CardHeader>
                <CardTitle className="text-xl">تحلیل امتیازات فصل</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">هنوز هیچ امتیازی در بخش‌های این فصل ثبت نشده است.</p>
            </CardContent>
        </Card>
    );
  }

  const averageRating = validRatings.reduce((a, b) => a + b, 0) / totalRatings;

  // محاسبه توزیع امتیازات برای نمودار
  const ratingDistribution = [
    { label: '5 ستاره', count: validRatings.filter(r => r === 5).length },
    { label: '4 ستاره', count: validRatings.filter(r => r === 4).length },
    { label: '3 ستاره', count: validRatings.filter(r => r === 3).length },
    { label: '2 ستاره', count: validRatings.filter(r => r === 2).length },
    { label: '1 ستاره', count: validRatings.filter(r => r === 1).length },
  ];

  return (
    <Card className="mt-6 bg-slate-100 border-slate-200">
      <CardHeader>
        <CardTitle className="text-xl">تحلیل امتیازات فصل</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* بخش آمار کلی در بالا */}
        <div className="flex items-center justify-around text-center border-b pb-6">
            <div className="flex-1">
                <p className="text-4xl font-bold text-amber-500">{averageRating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground mt-1">میانگین امتیاز</p>
            </div>
             <div className="border-l h-12"></div>
            <div className="flex-1">
                <p className="text-4xl font-bold">{totalRatings}</p>
                <p className="text-xs text-muted-foreground mt-1">تعداد کل آرا</p>
            </div>
        </div>
        
        {/* بخش نمودار میله‌ای */}
        <div className="space-y-3">
            {ratingDistribution.map((item, index) => {
                const percentage = totalRatings > 0 ? (item.count / totalRatings) * 100 : 0;
                return (
                    <div key={index} className="flex items-center gap-x-4">
                        <span className="text-sm text-muted-foreground w-16 text-right">{item.label}</span>
                        <Progress value={percentage} className="h-2 flex-1 [&>*]:bg-amber-400" />
                        <span className="text-sm font-mono w-8 text-left">{item.count}</span>
                    </div>
                )
            })}
        </div>
      </CardContent>
    </Card>
  );
};