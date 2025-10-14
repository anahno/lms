// فایل: app/(dashboard)/categories/page.tsx
"use server";

import { db } from "@/lib/db";
import { CategoryClient } from "./_components/CategoryClient";

export default async function CategoriesPage() {
  // تمام دسته‌بندی‌های اصلی را به همراه زیرمجموعه‌هایشان دریافت می‌کنیم
  const categories = await db.category.findMany({
    where: {
      parentId: null,
    },
    include: {
      subcategories: {
        orderBy: { name: "asc" },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="p-6">
      <CategoryClient initialData={categories} />
    </div>
  );
}