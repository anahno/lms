// فایل: app/(public)/payment-result/page.tsx
"use client";

// از useSearchParams برای خواندن پارامترهای URL استفاده می‌کنیم
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

// چون از هوک استفاده می‌کنیم، این کامپوننت باید کلاینت کامپوننت باشد
export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  // --- حالت پرداخت موفق ---
  if (status === "success") {
    const purchaseId = searchParams.get("purchaseId"); // شماره سفارش برای نمایش
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="w-full max-w-lg text-center animate-in fade-in-50 zoom-in-95">
          <CardHeader>
            <div className="mx-auto bg-emerald-100 rounded-full p-3 w-fit">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold text-slate-800">
              پرداخت موفقیت‌آمیز بود!
            </CardTitle>
            <CardDescription className="text-base">
              از خرید شما سپاسگزاریم. دوره به حساب کاربری شما اضافه شد.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {purchaseId && (
              <p className="text-sm text-slate-500 bg-slate-50 p-2 rounded-md inline-block">
                شماره سفارش: {purchaseId}
              </p>
            )}
            <div className="flex gap-4 justify-center mt-6">
              <Link href="/my-courses">
                <Button>مشاهده دوره‌های من</Button>
              </Link>
              <Link href="/courses">
                <Button variant="outline">بازگشت به کاتالوگ</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- حالت پرداخت ناموفق ---
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card className="w-full max-w-lg text-center animate-in fade-in-50 zoom-in-95">
        <CardHeader>
          <div className="mx-auto bg-red-100 rounded-full p-3 w-fit">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold text-slate-800">
            پرداخت ناموفق بود
          </CardTitle>
          <CardDescription className="text-base">
            تراکنش شما تکمیل نشد. در صورت کسر وجه از حساب شما، مبلغ طی ۷۲ ساعت آینده به حسابتان باز خواهد گشت.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex gap-4 justify-center mt-6">
              <Link href="/my-courses">
                  <Button variant="outline">بازگشت به دوره‌های من</Button>
              </Link>
              <Link href="/courses">
                  <Button>مشاهده دوره‌ها</Button>
              </Link>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}