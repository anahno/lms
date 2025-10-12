// فایل: providers.tsx
"use client"; // ۱. حتما "use client" در بالای فایل باشد

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // ۲. children باید داخل SessionProvider قرار بگیرد
  return <SessionProvider>{children}</SessionProvider>;
}