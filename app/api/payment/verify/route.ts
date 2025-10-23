// فایل: app/api/payment/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import axios from "axios";

const ZARINPAL_API_VERIFY = "https://api.zarinpal.com/pg/v4/payment/verify.json";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const authority = searchParams.get("Authority");
  const status = searchParams.get("Status");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  // اگر کاربر پرداخت را لغو کرده باشد یا خطایی قبل از پرداخت رخ داده باشد
  if (status !== "OK" || !authority) {
    console.log("تراکنش توسط کاربر لغو شد یا قبل از پرداخت با شکست مواجه شد.");
    return NextResponse.redirect(`${appUrl}/payment-result?status=failed`);
  }

  try {
    // 1. پیدا کردن رکورد خرید از طریق کد authority که از زرین‌پال برگشته
    const purchase = await db.purchase.findUnique({
      where: { authority },
    });

    // اگر رکوردی با این authority پیدا نشد، یعنی تراکنش معتبر نیست
    if (!purchase) {
      console.error("رکوردی برای این تراکنش یافت نشد. Authority:", authority);
      return NextResponse.redirect(`${appUrl}/payment-result?status=failed&error=notfound`);
    }

    // اگر تراکنش قبلاً با موفقیت تایید شده بود، دوباره کاری نکن
    if (purchase.status === 'COMPLETED') {
        console.log("این تراکنش قبلاً تایید شده است. کاربر به دوره‌های من هدایت می‌شود.");
        return NextResponse.redirect(`${appUrl}/my-courses`);
    }

    // 2. ارسال درخواست تایید نهایی (Verify) به سرور زرین‌پال
    const response = await axios.post(ZARINPAL_API_VERIFY, {
      merchant_id: process.env.ZARINPAL_MERCHANT_ID,
      amount: purchase.amount, // مبلغ باید با مبلغ اولیه ذخیره شده در دیتابیس یکسان باشد
      authority: authority,
    });

    // 3. پردازش پاسخ تایید زرین‌پال
    if (response.data.data.code === 100 || response.data.data.code === 101) {
      // کد 100 یعنی تراکنش موفق
      // کد 101 یعنی تراکنش موفق بوده ولی قبلاً تایید شده است (برای جلوگیری از خطای تکراری)
      const refId = response.data.data.ref_id;
      
      // از تراکنش پریزما استفاده می‌کنیم تا هر دو عملیات با هم انجام شوند
      await db.$transaction([
        // الف) وضعیت خرید را به "تکمیل شده" تغییر می‌دهیم
        db.purchase.update({
          where: { id: purchase.id },
          data: {
            status: "COMPLETED",
            refId: refId.toString(),
          },
        }),
        // ب) کاربر را به لیست دانشجویان دوره اضافه می‌کنیم
        db.enrollment.create({
          data: {
            userId: purchase.userId,
            learningPathId: purchase.learningPathId,
          },
        }),
      ]);

      console.log(`تراکنش با موفقیت تایید شد. کد پیگیری: ${refId}`);
      // کاربر را به صفحه پرداخت موفق هدایت می‌کنیم
      return NextResponse.redirect(`${appUrl}/payment-result?status=success&purchaseId=${purchase.id}`);
    } else {
      // 4. اگر تایید تراکنش با خطا مواجه شد
      await db.purchase.update({
        where: { id: purchase.id },
        data: { status: "FAILED" },
      });
      const errorCode = response.data.errors.code;
      console.error(`تایید تراکنش ناموفق بود. کد خطا: ${errorCode}`);
      return NextResponse.redirect(`${appUrl}/payment-result?status=failed&error=${errorCode}`);
    }
  } catch (error) {
    console.error("[PAYMENT_VERIFY_ERROR]", error);
    return NextResponse.redirect(`${appUrl}/payment-result?status=failed&error=server`);
  }
}