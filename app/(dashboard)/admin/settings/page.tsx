// فایل: app/(dashboard)/admin/settings/page.tsx
"use server";

import { db } from "@/lib/db";
import { PaymentSettingsClient } from "./_components/PaymentSettingsClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.ADMIN) {
    redirect("/dashboard");
  }

  const gateways = await db.paymentGatewaySetting.findMany();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">تنظیمات درگاه‌های پرداخت</h1>
      <PaymentSettingsClient initialData={gateways} />
    </div>
  );
}