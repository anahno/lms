// فایل: app/(public)/my-account/sessions/page.tsx
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStudentBookings } from "@/actions/booking-actions";
import { SessionsClient } from "./_components/SessionsClient";

export default async function MySessionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirect("/login");
  }

  const bookings = await getStudentBookings(session.user.id);

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">جلسات مشاوره من</h1>
      <SessionsClient initialBookings={bookings} />
    </div>
  );
}