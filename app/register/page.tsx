// فایل: app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const body = await response.json();
        // سرور ما در API یک رشته ساده برمی‌گرداند، نه یک آبجکت با message
        // پس خود body را به عنوان خطا در نظر می‌گیریم
        throw new Error(body || "خطایی در ثبت‌نام رخ داد.");
      }

      router.push("/login");

    } catch (err: unknown) { // ۱. تغییر از any به unknown
      // ۲. بررسی اینکه آیا err یک شیء از نوع Error است
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("یک خطای ناشناخته رخ داد.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ... بقیه کد JSX بدون تغییر باقی می‌ماند ...
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ایجاد حساب کاربری جدید</CardTitle>
          <CardDescription>برای شروع، اطلاعات خود را وارد کنید.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">نام (اختیاری)</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "در حال ثبت نام..." : "ثبت نام"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            حساب کاربری دارید؟{" "}
            <Link href="/login" className="underline">
              وارد شوید
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}