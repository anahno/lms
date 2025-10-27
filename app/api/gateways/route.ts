// فایل: app/api/gateways/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// این تابع فقط درگاه‌هایی را برمی‌گرداند که فعال هستند
export async function GET() {
  try {
    const gateways = await db.paymentGatewaySetting.findMany({
      where: { isEnabled: true },
      // فقط اطلاعات عمومی را انتخاب می‌کنیم
      select: {
        id: true,
        gatewayId: true,
        title: true,
      }
    });
    return NextResponse.json(gateways);
  } catch (error) {
    console.error("[GET_GATEWAYS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}