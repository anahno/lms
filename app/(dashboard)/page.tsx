// فایل: app/(dashboard)/page.tsx

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">داشبورد</h1>
      <p className="mt-2 text-muted-foreground">
        از اینجا می‌توانید مسیرهای یادگیری خود را مدیریت کنید.
      </p>
      <div className="mt-6">
        <Link href="/learning-paths/create">
          <Button>+ مسیر یادگیری جدید</Button>
        </Link>
      </div>
    </div>
  );
}