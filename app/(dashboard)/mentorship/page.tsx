
// فایل: app/(dashboard)/mentorship/page.tsx
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
// import { Role } from "@prisma/client"; // --- این import استفاده نشده و حذف می‌شود ---
import { getMentorshipData } from "@/actions/mentorship-actions";

import { MentorshipSettingsForm } from "./_components/MentorshipSettingsForm";
import { TimeSlotManager } from "./_components/TimeSlotManager";
import { UpcomingBookingsList } from "./_components/UpcomingBookingsList";

export default async function MentorshipPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
    return redirect("/dashboard");
  }

  const { mentorProfile, availableTimeSlots, confirmedBookings } = await getMentorshipData(session.user.id);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">مدیریت جلسات مشاوره (منتورشیپ)</h1>
        <p className="text-muted-foreground mt-2">
          در این بخش می‌توانید قابلیت مشاوره خصوصی را فعال کرده، قیمت‌گذاری کنید و برنامه‌زمانی خود را تنظیم نمایید.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <MentorshipSettingsForm initialData={mentorProfile} />
          <TimeSlotManager 
            initialData={availableTimeSlots} 
            isEnabled={mentorProfile?.isEnabled || false} 
          />
        </div>
        
        <div className="lg:col-span-1">
          <UpcomingBookingsList initialData={confirmedBookings} />
        </div>
      </div>
    </div>
  );
}