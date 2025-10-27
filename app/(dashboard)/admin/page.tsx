// فایل: app/(dashboard)/admin/page.tsx
"use server";

import { redirect } from "next/navigation";

// این صفحه هیچ محتوایی ندارد و فقط کاربر را به داشبورد اصلی هدایت می‌کند.
// این کار از ایجاد یک صفحه خالی در مسیر /admin جلوگیری می‌کند.
export default async function AdminPage() {
  redirect("/dashboard");
}