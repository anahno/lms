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
        where: { id: { in: timeSlotIds }, status: 'BOOKED' },
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

  // +++ شروع اصلاح اصلی: پیدا کردن Purchase با purchaseId +++
  const purchaseId = searchParams.get("purchaseId");
  let purchase = null;

  if (purchaseId) {
    purchase = await db.purchase.findUnique({ where: { id: purchaseId } });
  } else if (authority) {
    // این به عنوان fallback باقی می‌ماند
    purchase = await db.purchase.findUnique({ where: { authority } });
  }
  // +++ پایان اصلاح اصلی +++

  if (status !== "OK") { // این شرط به تنهایی برای تشخیص انصراف/خطا کافی است
    console.log("تراکنش لغو شد یا با خطا مواجه شد.");
    if (purchase && purchase.type === PurchaseType.MENTORSHIP) {
      await releaseMentorshipSlots(purchase.id);
    }
    return NextResponse.redirect(`${appUrl}/payment-result?status=failed`);
  }

  // اگر پرداخت موفق بود اما purchase پیدا نشد، یک خطای جدی رخ داده
  if (!purchase || !authority) {
      console.error("Invalid callback: Status is OK but purchase or authority not found.");
      return NextResponse.redirect(`${appUrl}/payment-result?status=failed&error=invalid_callback`);
  }


  try {
    if (purchase.status === 'COMPLETED') {
        const redirectUrl = purchase.type === PurchaseType.COURSE ? '/my-courses' : '/my-account/sessions';
        return NextResponse.redirect(`${appUrl}${redirectUrl}`);
    }
    
    const merchantId = isSandbox 
        ? process.env.ZARINPAL_SANDBOX_MERCHANT_ID 
        : process.env.ZARINPAL_MERCHANT_ID;

    const amountInRialsForVerify = Math.round(purchase.amount) * 10;

    const response = await axios.post(ZARINPAL_API_VERIFY, {
      merchant_id: merchantId,
      amount: amountInRialsForVerify,
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
            data: { status: "CONFIRMED" },
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