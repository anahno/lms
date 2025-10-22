// فایل: app/(dashboard)/admin/reports/_components/AdvancedReportsClient.tsx
"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadCloud, Users, BookOpen, BarChart3, HelpCircle } from "lucide-react";
import { type ReportType } from "@/actions/generate-report";

const reportOptions = [
  { type: "users" as ReportType, title: "گزارش کاربران", description: "لیست کامل کاربران به همراه اطلاعات ثبت‌نام، نقش و فعالیت کلی آن‌ها.", icon: Users },
  { type: "course_performance" as ReportType, title: "گزارش عملکرد دوره‌ها", description: "آمار کلی هر دوره شامل تعداد ثبت‌نام، میانگین پیشرفت و میانگین امتیازات.", icon: BookOpen },
  { type: "student_progress" as ReportType, title: "گزارش پیشرفت دانشجویان", description: "گزارش دقیق پیشرفت هر دانشجو در هر دوره‌ای که ثبت‌نام کرده است.", icon: BarChart3 },
  { type: "quiz_submissions" as ReportType, title: "گزارش نتایج آزمون‌ها", description: "تمام نتایج ثبت شده برای آزمون‌ها به تفکیک کاربر، دوره و نمره کسب شده.", icon: HelpCircle },
];

export const AdvancedReportsClient = () => {
  const [loadingReport, setLoadingReport] = useState<ReportType | null>(null);

  const handleDownload = async (reportType: ReportType) => {
    setLoadingReport(reportType);
    toast.loading("در حال آماده‌سازی گزارش...");

    try {
      // +++ شروع تغییر کلیدی +++
      // به axios می‌گوییم که پاسخ را به صورت blob دریافت کند
      const response = await axios.post("/api/admin/reports", 
        { reportType },
        { responseType: 'blob' } // این خط بسیار مهم است
      );
      // +++ پایان تغییر کلیدی +++
      
      toast.dismiss();
      toast.success("گزارش آماده دانلود است.");

      // ایجاد و دانلود فایل CSV در مرورگر
      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // حافظه را آزاد می‌کنیم

    } catch (error) {
      toast.dismiss();
      toast.error("خطایی در ایجاد گزارش رخ داد.");
      console.error("Report generation failed:", error);
    } finally {
      setLoadingReport(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {reportOptions.map((opt) => (
        <Card key={opt.type}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><opt.icon className="w-5 h-5" />{opt.title}</CardTitle>
                <CardDescription className="mt-2">{opt.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleDownload(opt.type)}
              disabled={loadingReport !== null}
              className="w-full"
            >
              <DownloadCloud className="w-4 h-4 ml-2" />
              {loadingReport === opt.type ? "در حال آماده‌سازی..." : "دانلود CSV"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};