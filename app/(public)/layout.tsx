// فایل: app/(public)/layout.tsx

import { PublicNavbar } from "@/components/PublicNavbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      <main className="pt-10 pb-20">
        {children}
      </main>
    </div>
  );
}