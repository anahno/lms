// فایل کامل و اصلاح شده: app/api/payment/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import axios from "axios";
import { PurchaseType, PurchaseStatus } from "@prisma/client";

const NEXTPAY_API_VERIFY = "https://nextpay.org/nx/gateway/verify";
const ZARINPAL_API_VERIFY = process.env.ZARINPAL_MODE === "sandbox"
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
      console.log(`[Payment Failed] Released ${timeSlotIds.length} time slots for purchase ${purchaseId}`);
    }
  } catch (error) {
    console.error("[RELEASE_SLOTS_ERROR]", error);
  }
}

async function handleSuccessfulPurchase(purchaseId: string, refId: string) {
  await db.$transaction(async (prisma) => {
    const purchase = await prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: PurchaseStatus.COMPLETED, refId: refId },
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
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const zarinpalAuthority = searchParams.get("Authority");
  const zarinpalStatus = searchParams.get("Status");

  const nextpayTransId = searchParams.get("trans_id");
  const nextpayOrderId = searchParams.get("order_id");

  // ========= منطق برای NextPay =========
  if (nextpayTransId && nextpayOrderId) {
    const purchase = await db.purchase.findUnique({ where: { id: nextpayOrderId } });
    if (!purchase) {
      return NextResponse.redirect(`${appUrl}/payment-result?status=failed&error=invalid_order`);
    }

    if (searchParams.get("np_status") !== "OK") {
        await db.purchase.update({ where: { id: purchase.id }, data: { status: PurchaseStatus.FAILED } });
        if (purchase.type === PurchaseType.MENTORSHIP) await releaseMentorshipSlots(purchase.id);
        return NextResponse.redirect(`${appUrl}/payment-result?status=failed`);
    }

    try {
      // ==================== شروع تغییر اصلی برای NextPay ====================
      // طبق مستندات، مبلغ تایید هم به تومان است. پس ضرب در ۱۰ را حذف می‌کنیم.
      const amountInTomans = Math.round(purchase.amount);
      // ===================== پایان تغییر اصلی برای NextPay =====================

      const response = await axios.post(NEXTPAY_API_VERIFY, {
        api_key: process.env.NEXTPAY_API_KEY,
        amount: amountInTomans, // <-- از مبلغ به تومان برای تایید استفاده می‌کنیم
        trans_id: nextpayTransId,
      });

      // طبق مستندات، کد موفقیت برای تایید، عدد 0 است.
      if (response.data.code.toString() === "0") {
        await handleSuccessfulPurchase(purchase.id, response.data.Shaparak_Ref_Id);
        return NextResponse.redirect(`${appUrl}/payment-result?status=success&purchaseId=${purchase.id}`);
      } else {
        await db.purchase.update({ where: { id: purchase.id }, data: { status: PurchaseStatus.FAILED } });
        if (purchase.type === PurchaseType.MENTORSHIP) await releaseMentorshipSlots(purchase.id);
        return NextResponse.redirect(`${appUrl}/payment-result?status=failed&error=${response.data.code}`);
      }
    } catch (error) {
      console.error("[NEXTPAY_VERIFY_ERROR]", error);
      if (purchase.type === PurchaseType.MENTORSHIP) await releaseMentorshipSlots(purchase.id);
      return NextResponse.redirect(`${appUrl}/payment-result?status=failed&error=server`);
    }
  }

  // ========= منطق برای Zarinpal (صحیح) =========
  if (zarinpalAuthority) {
    const purchase = await db.purchase.findUnique({ where: { authority: zarinpalAuthority } });
    if (zarinpalStatus !== "OK" || !purchase) {
      if (purchase && purchase.type === PurchaseType.MENTORSHIP) await releaseMentorshipSlots(purchase.id);
      return NextResponse.redirect(`${appUrl}/payment-result?status=failed`);
    }

    try {
      const amountInTomans = Math.round(purchase.amount);

      const response = await axios.post(ZARINPAL_API_VERIFY, {
        merchant_id: process.env.ZARINPAL_MODE === "sandbox" 
          ? process.env.ZARINPAL_SANDBOX_MERCHANT_ID 
          : process.env.ZARINPAL_MERCHANT_ID,
        amount: amountInTomans,
        authority: zarinpalAuthority,
      });

      if (response.data.data.code === 100 || response.data.data.code === 101) {
        await handleSuccessfulPurchase(purchase.id, response.data.data.ref_id.toString());
        return NextResponse.redirect(`${appUrl}/payment-result?status=success&purchaseId=${purchase.id}`);
      } else {
        await db.purchase.update({ where: { id: purchase.id }, data: { status: PurchaseStatus.FAILED } });
        if (purchase.type === PurchaseType.MENTORSHIP) await releaseMentorshipSlots(purchase.id);
        return NextResponse.redirect(`${appUrl}/payment-result?status=failed&error=${response.data.errors.code}`);
      }
    } catch (error) {
      console.error("[ZARINPAL_VERIFY_ERROR]", error);
      if (purchase.type === PurchaseType.MENTORSHIP) await releaseMentorshipSlots(purchase.id);
      return NextResponse.redirect(`${appUrl}/payment-result?status=failed&error=server`);
    }
  }

  return NextResponse.redirect(`${appUrl}/payment-result?status=failed&error=invalid_request`);
}