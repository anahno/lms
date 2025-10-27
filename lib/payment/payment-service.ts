// فایل: lib/payment/payment-service.ts

import { createZarinpalRequest } from "./providers/zarinpal";
import { createNextPayRequest } from "./providers/nextpay"; // ۱. منطق نکست‌پی را وارد می‌کنیم

export interface PaymentRequestPayload {
  userId: string;
  email?: string | null;
  amount: number;
  description: string;
  purchaseId: string;
  callbackUrl: string;
}

export interface PaymentResponse {
  success: boolean;
  url?: string;
  error?: string;
}

// ۲. 'nextpay' را به عنوان یک درگاه معتبر به سیستم معرفی می‌کنیم
export type PaymentGateway = "zarinpal" | "nextpay";

/**
 * بر اساس درگاه انتخابی، یک درخواست پرداخت ایجاد می‌کند.
 * این تابع به عنوان یک "Factory" عمل می‌کند.
 */
export const createPaymentRequest = async (
  gateway: PaymentGateway,
  payload: PaymentRequestPayload
): Promise<PaymentResponse> => {
  switch (gateway) {
    case "zarinpal":
      return await createZarinpalRequest(payload);
    
    // ۳. اگر ورودی 'nextpay' بود، تابع مربوط به آن را فراخوانی کن
    case "nextpay":
      return await createNextPayRequest(payload);
    
    default:
      return {
        success: false,
        error: "درگاه پرداخت انتخاب شده پشتیبانی نمی‌شود.",
      };
  }
};