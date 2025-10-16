// فایل: types/next-auth.d.ts

import NextAuth, { type DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client"; // UserRole را از Prisma وارد می‌کنیم

// ماژول JWT را برای اضافه کردن پراپرتی‌های سفارشی به توکن، گسترش می‌دهیم
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: UserRole; // نقش کاربر را به توکن اضافه می‌کنیم
  }
}

// ماژول اصلی next-auth را گسترش می‌دهیم
declare module "next-auth" {
  /**
   * شکل آبجکت User را که از دیتابیس برمی‌گردد، تعریف می‌کنیم.
   */
  interface User {
    id: string;
    role: UserRole; // نقش کاربر را به آبجکت User اضافه می‌کنیم
  }

  /**
   * شکل آبجکت Session را که در کلاینت و سرور استفاده می‌شود، بازنویسی می‌کنیم.
   */
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"]; // پراپرتی‌های پیش‌فرض (name, email, image) را حفظ می‌کنیم
  }
}