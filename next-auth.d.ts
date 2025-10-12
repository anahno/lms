// فایل: next-auth.d.ts

import { DefaultSession } from "next-auth";

// ماژول next-auth را گسترش می‌دهیم
declare module "next-auth" {
  /**
   * این اینترفیس Session را گسترش می‌دهد تا فیلدهای سفارشی ما را شامل شود.
   * این نوع داده توسط هوک useSession و تابع getSession استفاده می‌شود.
   */
  interface Session {
    user: DefaultSession["user"] & {
      // فیلد id را به آبجکت user اضافه می‌کنیم
      id: string;
    };
  }
}