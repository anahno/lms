// فایل: app/api/payment/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import axios from "axios";
import { PurchaseType } from "@prisma/client";

const isSandbox = process.env.ZARINPAL_MODE === "sandbox";
const ZARINPAL_API_VERIFY = isSandbox 
    ? "https://sandbox.zarinpal.com/pg/v4/payment/verify.json" 
    : "https://api.zarinpal.com/pg/v4/payment/verify.json";

async function releaseMentorshipSlots(purchaseId: string) {
  try {
    const bookings = await db.booking.findMany({
      where: { purchaseId },
      select: { timeSlotId: true },
    });
    
    if (bookings.length > 0) {
      const timeSlotIds = bookings.map(b => b.timeSlotId);
      await db.timeSlot.updateMany({
        where: { id: { in: timeSlotIds }, status: 'BOOKED' }, // فقط آنهایی که رزرو شده‌اند را آزاد کن
        data: { status: "AVAILABLE" },
      });
      console.log(`[Payment Cancelled/Failed] Released ${timeSlotIds.length} time slots for purchase ${purchaseId}`);
    }
  } catch (error) {
    console.error("[RELEASE_SLOTS_ERROR]", error);
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const authority = searchParams.get("Authority");
  const status = searchParams.get("Status");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const purchase = authority ? await db.purchase.findUnique({ where: { authority } }) : null;

  if (status !== "OK" || !authority || !purchase) {
    console.log("تراکنش لغو شد یا نامعتبر است.");
    if (purchase && purchase.type === PurchaseType.MENTORSHIP) {
      await releaseMentorshipSlots(purchase.id);
    }
    return NextResponse.redirect(`${appUrl}/payment-result?status=failed`);
  }

  try {
    if (purchase.status === 'COMPLETED') {
        const redirectUrl = purchase.type === PurchaseType.COURSE ? '/my-courses' : '/my-account/sessions';
        return NextResponse.redirect(`${appUrl}${redirectUrl}`);
    }
    
    const merchantId = isSandbox 
        ? process.env.ZARINPAL_SANDBOX_MERCHANT_ID 
        : process.env.ZARINPAL_MERCHANT_ID;

    // +++ شروع اصلاح اصلی و حیاتی +++
    // مبلغی که برای تایید ارسال می‌شود باید به ریال باشد
    const amountInRialsForVerify = Math.round(purchase.amount) * 10;
    // +++ پایان اصلاح اصلی +++

    const response = await axios.post(ZARINPAL_API_VERIFY, {
      merchant_id: merchantId,
      amount: amountInRialsForVerify, // <-- از مبلغ به ریال استفاده می‌کنیم
      authority: authority,
    });

    if (response.data.data.code === 100 || response.data.data.code === 101) {
      const refId = response.data.data.ref_id;
      
      await db.$transaction(async (prisma) => {
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: { status: "COMPLETED", refId: refId.toString() },
        });

        if (purchase.type === PurchaseType.COURSE && purchase.learningPathId) {
          await prisma.enrollment.create({
            data: { userId: purchase.userId, learningPathId: purchase.learningPathId },
          });
        } else if (purchase.type === PurchaseType.MENTORSHIP) {
          await prisma.booking.updateMany({
            where: { purchaseId: purchase.id },
            data: { status: "CONFIRMED" }, // وضعیت صحیح CONFIRMED است
          });
        }
      });

      console.log(`تراکنش با موفقیت تایید شد. کد پیگیری: ${refId}`);
      return NextResponse.redirect(`${appUrl}/payment-result?status=success&purchaseId=${purchase.id}`);
    } else {
      await db.purchase.update({
        where: { id: purchase.id },
        data: { status: "FAILED" },
      });
      if (purchase.type === PurchaseType.MENTORSHIP) {
        await releaseMentorshipSlots(purchase.id);
      }
      const errorCode = response.data.errors.code;
      console.error(`تایید تراکنش ناموفق بود. کد خطا: ${errorCode}`);
      return NextResponse.redirect(`${appUrl}/payment-result?status=failed&error=${errorCode}`);
    }
  } catch (error) {
    console.error("[PAYMENT_VERIFY_ERROR]", error);
    if (axios.isAxiosError(error)) {
        console.error("[AXIOS_ERROR_DATA_VERIFY]", error.response?.data);
    }
    if (purchase && purchase.type === PurchaseType.MENTORSHIP) {
        await releaseMentorshipSlots(purchase.id);
    }
    return NextResponse.redirect(`${appUrl}/payment-result?status=failed&error=server`);
  }
}