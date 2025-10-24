// فایل: actions/payment-actions.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // مسیر authOptions را بررسی کنید صحیح باشد
import { db } from "@/lib/db";
import axios from "axios";

// آدرس‌های API زرین‌پال
const ZARINPAL_API_REQUEST = "https://api.zarinpal.com/pg/v4/payment/request.json";
const ZARINPAL_START_PAY_URL = "https://www.zarinpal.com/pg/StartPay/";

/**
 * یک درخواست پرداخت برای یک دوره مشخص ایجاد کرده و لینک پرداخت را برمی‌گرداند.
 * @param learningPathId - شناسه‌ی دوره‌ای که کاربر قصد خرید آن را دارد.
 * @returns آبجکتی شامل لینک پرداخت در صورت موفقیت، یا پیام خطا در صورت شکست.
 */
export const createPaymentRequest = async (learningPathId: string) => {
  // +++ ۱. بررسی حیاتی: چک کردن وجود Merchant ID +++
  if (!process.env.ZARINPAL_MERCHANT_ID) {
    console.error("[FATAL_PAYMENT_ERROR] ZARINPAL_MERCHANT_ID is not set in environment variables.");
    return { error: "تنظیمات درگاه پرداخت صحیح نیست. لطفاً با پشتیبانی تماس بگیرید." };
  }
  // +++ پایان بررسی +++

  // 1. بررسی نشست و احراز هویت کاربر
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "برای خرید دوره ابتدا باید وارد شوید." };
  }
  const userId = session.user.id;

  // 2. پیدا کردن دوره و بررسی شرایط اولیه
  const course = await db.learningPath.findUnique({
    where: { id: learningPathId, status: "PUBLISHED" },
  });

  if (!course) {
    return { error: "دوره یافت نشد یا هنوز منتشر نشده است." };
  }

  if (!course.price || course.price <= 0) {
    return { error: "این دوره رایگان است و نیازی به پرداخت ندارد." };
  }
  
  // 3. بررسی اینکه آیا کاربر قبلا این دوره را خریده یا در آن ثبت‌نام کرده است
  const existingEnrollment = await db.enrollment.findUnique({
    where: { userId_learningPathId: { userId, learningPathId } },
  });

  if (existingEnrollment) {
    return { error: "شما قبلاً در این دوره ثبت‌نام کرده‌اید." };
  }

  const amount = course.price; // مبلغ به تومان
  const description = `خرید دوره: ${course.title}`;
  const callback_url = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/verify`;

  try {
    // 4. ایجاد یک رکورد خرید موقت در دیتابیس با وضعیت "در انتظار"
    const purchase = await db.purchase.upsert({
      where: { userId_learningPathId: { userId, learningPathId } },
      update: { amount },
      create: {
        userId,
        learningPathId,
        amount,
      },
    });

    // 5. ارسال درخواست به سرور زرین‌پال
    const response = await axios.post(ZARINPAL_API_REQUEST, {
      merchant_id: process.env.ZARINPAL_MERCHANT_ID,
      amount,
      description,
      callback_url,
      metadata: {
        email: session.user.email,
      },
    });

    // 6. پردازش پاسخ زرین‌پال
    if (response.data.data.code === 100) {
      const authority = response.data.data.authority;

      // 7. ذخیره کد authority
      await db.purchase.update({
        where: { id: purchase.id },
        data: { authority },
      });

      const paymentUrl = `${ZARINPAL_START_PAY_URL}${authority}`;
      
      console.log(`[Payment] User ${userId} redirected to: ${paymentUrl}`);
      
      // 8. بازگرداندن لینک پرداخت
      return { success: true, url: paymentUrl };

    } else {
      const error_code = response.data.errors.code;
      const error_message = response.data.errors.message;
      console.error(`[Zarinpal Error] Code: ${error_code}, Message: ${error_message}`);
      return { error: `خطا در ارتباط با درگاه پرداخت: ${error_message}` };
    }
  } catch (error) {
    console.error("[PAYMENT_REQUEST_ERROR]", error);
    return { error: "خطای داخلی سرور هنگام ایجاد درخواست پرداخت." };
  }
};