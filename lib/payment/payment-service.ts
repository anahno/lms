// فایل: lib/payment/payment-service.ts

import { createZarinpalRequest } from "./providers/zarinpal";

export interface PaymentRequestPayload {
  userId: string;
  email?: string | null;
  amount: number;
  description: string;
  purchaseId: string; // ID رکورد Purchase برای اتصال
  callbackUrl: string;
}

export interface PaymentResponse {
  success: boolean;
  url?: string;
  error?: string;
}

// در حال حاضر فقط یک نوع درگاه داریم، اما این ساختار قابل گسترش است
export type PaymentGateway = "zarinpal" | "nextpay" | "idpay";

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
    
    // در آینده می‌توانید درگاه‌های دیگر را به اینجا اضافه کنید
    // case "nextpay":
    //   return await createNextPayRequest(payload);
    
    default:
      return {
        success: false,
        error: "درگاه پرداخت انتخاب شده پشتیبانی نمی‌شود.",
      };
  }
};