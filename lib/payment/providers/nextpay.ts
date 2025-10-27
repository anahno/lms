// فایل: lib/payment/providers/nextpay.ts

import axios from "axios";
import { db } from "@/lib/db";
import type { PaymentRequestPayload, PaymentResponse } from "../payment-service";

const NEXTPAY_API_REQUEST = "https://nextpay.org/nx/gateway/token";
const NEXTPAY_START_PAY_URL = "https://nextpay.org/nx/gateway/payment";

export const createNextPayRequest = async (
  payload: PaymentRequestPayload
): Promise<PaymentResponse> => {
  const { amount, description, callbackUrl, purchaseId } = payload;

  // ۱. کلید API را از فایل .env می‌خوانیم
  const apiKey = process.env.NEXTPAY_API_KEY;

  if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
    console.error("[FATAL_PAYMENT_ERROR] NEXTPAY_API_KEY is not set.");
    return { success: false, error: "تنظیمات درگاه پرداخت نکست‌پی صحیح نیست." };
  }

  try {
    // ۲. مبلغ را به ریال تبدیل می‌کنیم (چون نکست‌پی ریال دریافت می‌کند)
    const amountInRials = Math.round(amount);

    // ۳. درخواست را به سرور نکست‌پی ارسال می‌کنیم
    const response = await axios.post(NEXTPAY_API_REQUEST, {
      api_key: apiKey,
      amount: amountInRials,
      order_id: purchaseId, // از شناسه خرید خودمان به عنوان شناسه سفارش استفاده می‌کنیم
      callback_uri: callbackUrl,
      description: description,
    });

    // ۴. پاسخ را بررسی می‌کنیم
    if (response.data.code.toString() === "0") {
      // اگر موفق بود (کد 0)
      const trans_id = response.data.trans_id;

      // ۵. شناسه تراکنش (trans_id) را در دیتابیس ذخیره می‌کنیم تا بعدا برای تایید پرداخت استفاده کنیم
      await db.purchase.update({
        where: { id: purchaseId },
        data: { authority: trans_id }, // از فیلد authority برای ذخیره این شناسه استفاده می‌کنیم
      });

      // ۶. لینک پرداخت را ساخته و برمی‌گردانیم
      const paymentUrl = `${NEXTPAY_START_PAY_URL}/${trans_id}`;
      return { success: true, url: paymentUrl };
    } else {
      // اگر ناموفق بود
      const errorCode = response.data.code;
      console.error(`[NextPay Error] Code: ${errorCode}`);
      return { success: false, error: `خطا در ارتباط با درگاه پرداخت نکست‌پی. کد خطا: ${errorCode}` };
    }
  } catch (error) {
    console.error("[NEXTPAY_REQUEST_ERROR]", error);
    return { success: false, error: "خطای سرور هنگام ایجاد درخواست پرداخت با نکست‌پی." };
  }
};