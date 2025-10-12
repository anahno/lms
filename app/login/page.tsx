// فایل: app/login/page.tsx
"use client"; // این کامپوننت باید در سمت کلاینت اجرا شود چون با فرم کار داریم

import { useState } from "react";
import { signIn } from "next-auth/react"; // تابعی برای شروع فرآیند ورود
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      redirect: false, // ما خودمان کاربر را هدایت می‌کنیم
      email,
      password,
    });

    if (result?.error) {
      setError("ایمیل یا رمز عبور اشتباه است.");
    } else {
      router.push("/"); // بعد از ورود موفق، به صفحه اصلی برو
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">ورود به پنل مدیریت</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email">ایمیل</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border rounded-md"
            />
          </div>
          <div>
            <label htmlFor="password">رمز عبور</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border rounded-md"
            />
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" className="w-full">
            ورود
          </Button>
        </form>
      </div>
    </div>
  );
}