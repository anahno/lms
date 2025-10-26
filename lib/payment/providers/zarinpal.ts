// فایل: lib/payment/providers/zarinpal.ts

import axios from "axios";
import { db } from "@/lib/db";
import type { PaymentRequestPayload, PaymentResponse } from "../payment-service";

const isSandbox = process.env.ZARINPAL_MODE === "sandbox";

const ZARINPAL_API_BASE = isSandbox ? "https://sandbox.zarinpal.com/pg/v4/payment" : "https://api.zarinpal.com/pg/v4/payment";
const ZARINPAL_START_PAY_BASE = isSandbox ? "https://sandbox.zarinpal.com/pg/StartPay" : "https://www.zarinpal.com/pg/StartPay";

const ZARINPAL_API_REQUEST = `${ZARINPAL_API_BASE}/request.json`;
const ZARINPAL_START_PAY_URL = ZARINPAL_START_PAY_BASE;

const MIN_AMOUNT_TOMAN = 1000;

export const createZarinpalRequest = async (
  payload: PaymentRequestPayload
): Promise<PaymentResponse> => {
  const { userId, amount, description, callbackUrl, purchaseId, email } = payload;
  
  if (amount < MIN_AMOUNT_TOMAN && !isSandbox) { 
    return { 
      success: false, 
      error: `مبلغ تراکنش باید حداقل ${MIN_AMOUNT_TOMAN.toLocaleString('fa-IR')} تومان باشد.` 
    };
  }

  const merchantId = isSandbox 
    ? process.env.ZARINPAL_SANDBOX_MERCHANT_ID 
    : process.env.ZARINPAL_MERCHANT_ID;

  if (!merchantId) {
    const errorMsg = isSandbox 
      ? "ZARINPAL_SANDBOX_MERCHANT_ID یافت نشد." 
      : "ZARINPAL_MERCHANT_ID یافت نشد.";
    console.error(`[FATAL_PAYMENT_ERROR] ${errorMsg}`);
    return { success: false, error: "تنظیمات درگاه پرداخت صحیح نیست." };
  }

  console.log(`[Payment] Mode: ${isSandbox ? 'Sandbox' : 'Production'}`);

  try {
    const amountInRials = Math.round(amount) * 10;
    
    const requestBody = {
      merchant_id: merchantId,
      amount: amountInRials,
      description: description,
      callback_url: callbackUrl,
      metadata: { email: email },
    };
    
    console.log("[Zarinpal Request Body]", requestBody);

    const response = await axios.post(ZARINPAL_API_REQUEST, requestBody);

    if (response.data.data.code === 100) {
      const authority = response.data.data.authority;

      await db.purchase.update({
        where: { id: purchaseId, userId },
        data: { authority },
      });

      const paymentUrl = `${ZARINPAL_START_PAY_URL}/${authority}`;
      console.log(`[Payment] User ${userId} redirected to Zarinpal: ${paymentUrl}`);

      return { success: true, url: paymentUrl };
    } else {
      const errorMsg = response.data.errors.message;
      console.error(`[Zarinpal Error]`, response.data.errors);
      return { success: false, error: `خطا در ارتباط با درگاه پرداخت: ${errorMsg}` };
    }
  // +++ شروع اصلاح +++
  } catch (error: unknown) { // <-- تغییر از any به unknown
    // با استفاده از isAxiosError، نوع خطا را به صورت امن بررسی می‌کنیم
    if (axios.isAxiosError(error)) {
      console.error("[ZARINPAL_AXIOS_ERROR_DATA]", error.response?.data);
    } else {
      console.error("[ZARINPAL_REQUEST_ERROR]", error);
    }
  // +++ پایان اصلاح +++
    return { success: false, error: "خطای داخلی سرور هنگام ایجاد درخواست پرداخت." };
  }
};