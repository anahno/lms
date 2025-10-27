// فایل: app/api/admin/settings/payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== Role.ADMIN) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { settings } = await req.json();

    // با استفاده از تراکنش، تمام تغییرات را یکجا در دیتابیس ذخیره می‌کنیم
    await db.$transaction(
      settings.map((s: { id: string, isEnabled: boolean, apiKey: string | null }) =>
        db.paymentGatewaySetting.update({
          where: { id: s.id },
          data: { isEnabled: s.isEnabled, apiKey: s.apiKey },
        })
      )
    );
    
    return NextResponse.json({ message: "Success" });
  } catch (error) {
    console.error("[PAYMENT_SETTINGS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}