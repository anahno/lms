// فایل: app/(dashboard)/browse-courses/_components/StudentPerformanceList.tsx
"use client";

import { StudentPerformance } from "@/actions/get-student-performance";
import { Badge } from "@/components/ui/badge";

interface StudentPerformanceListProps {
  students: StudentPerformance[];
}

export const StudentPerformanceList = ({ students }: StudentPerformanceListProps) => {
  if (students.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground p-4">
        هنوز هیچ دانشجویی در این دوره ثبت‌نام نکرده است.
      </div>
    );
  }

  return (
    <div className="mt-2 border-t pt-2 space-y-2">
      {students.map(student => (
        <div key={student.id} className="border bg-white rounded-md p-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-800">{student.name}</p>
              <p className="text-xs text-muted-foreground">{student.email}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-600">معدل کل</p>
              <Badge variant="secondary" className="text-lg font-bold">
                {/* --- شروع تغییر برای رفع خطا --- */}
                {student.averageScore.toLocaleString("fa-IR", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}%
                {/* --- پایان تغییر --- */}
              </Badge>
            </div>
          </div>
          
          {student.submissions.length > 0 && (
            <div className="border-t mt-3 pt-3 space-y-1">
                <p className="text-xs font-semibold mb-2">جزئیات نمرات:</p>
                {student.submissions.map((sub, index) => (
                    <div key={index} className="flex justify-between items-center text-xs p-1 rounded hover:bg-slate-50">
                        <span className="text-slate-700">{sub.quizTitle}</span>
                        <span className={`font-mono font-bold ${sub.score === null ? 'text-slate-400' : 'text-slate-800'}`}>
                            {sub.score !== null ? `${sub.score.toFixed(0)}%` : "-"}
                        </span>
                    </div>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};