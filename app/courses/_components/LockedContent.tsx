// فایل: app/courses/_components/LockedContent.tsx
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LockedContentProps {
  courseId: string;
}

export const LockedContent = ({ courseId }: LockedContentProps) => {
  return (
    <div className="p-8 h-full w-full flex flex-col items-center justify-center bg-slate-100 rounded-lg text-center space-y-4">
      <div className="p-4 bg-amber-200 rounded-full">
        <Lock className="h-10 w-10 text-amber-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800">این بخش قفل است</h2>
      <p className="text-slate-600 max-w-md">
        برای دسترسی به این بخش و تمام محتوای دوره، ابتدا باید در دوره ثبت‌نام کنید یا آن را خریداری نمایید.
      </p>
      <Link href={`/courses/${courseId}`}>
        <Button size="lg">مشاهده دوره و ثبت‌نام</Button>
      </Link>
    </div>
  );
};