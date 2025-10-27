// فایل: app/(dashboard)/admin/settings/_components/PaymentSettingsClient.tsx
"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { PaymentGatewaySetting } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PaymentSettingsClientProps {
  initialData: PaymentGatewaySetting[];
}

export const PaymentSettingsClient = ({ initialData }: PaymentSettingsClientProps) => {
  const [settings, setSettings] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: string, isEnabled: boolean) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, isEnabled } : s));
  };

  const handleApiKeyChange = (id: string, apiKey: string) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, apiKey } : s));
  };
  
  const handleSave = () => {
    startTransition(async () => {
        try {
            await axios.patch('/api/admin/settings/payment', { settings });
            toast.success("تنظیمات با موفقیت ذخیره شد.");
        } catch {
            toast.error("خطا در ذخیره تنظیمات.");
        }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>مدیریت درگاه‌های پرداخت</CardTitle>
        <CardDescription>درگاه‌های پرداخت فعال سایت را انتخاب و مدیریت کنید.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ========== شروع تغییر اصلی ========== */}
        {settings.length > 0 ? (
          settings.map(gateway => (
            <div key={gateway.id} className="p-4 border rounded-lg bg-slate-50 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor={`switch-${gateway.id}`} className="text-lg font-semibold">{gateway.title}</Label>
                <Switch
                  id={`switch-${gateway.id}`}
                  checked={gateway.isEnabled}
                  onCheckedChange={(checked) => handleToggle(gateway.id, checked)}
                />
              </div>
              {gateway.gatewayId === 'nextpay' && (
                <div className="space-y-2">
                  <Label htmlFor={`apikey-${gateway.id}`}>کلید API (API Key)</Label>
                  <Input
                    id={`apikey-${gateway.id}`}
                    value={gateway.apiKey || ""}
                    onChange={(e) => handleApiKeyChange(gateway.id, e.target.value)}
                    placeholder="کلید API دریافت شده از نکست‌پی را اینجا وارد کنید"
                    dir="ltr"
                  />
                </div>
              )}
              {gateway.gatewayId === 'zarinpal' && (
                  <p className="text-sm text-muted-foreground">
                      تنظیمات زرین‌پال (Merchant ID) از طریق فایل .env مدیریت می‌شود.
                  </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            هیچ درگاه پرداختی در دیتابیس یافت نشد. لطفاً دستور npx prisma db seed را اجرا کنید.
          </p>
        )}
        {/* ========== پایان تغییر اصلی ========== */}

        <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isPending || settings.length === 0}>
                {isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};