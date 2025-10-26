// فایل: app/(dashboard)/mentorship/_components/AddMeetingLinkModal.tsx
"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { addMeetingLinkToBooking } from "@/actions/mentorship-actions";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";

interface AddMeetingLinkModalProps {
  bookingId: string;
  initialLink: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AddMeetingLinkModal = ({ bookingId, initialLink, isOpen, onClose }: AddMeetingLinkModalProps) => {
  const [link, setLink] = useState(initialLink || "");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await addMeetingLinkToBooking(bookingId, link);
      if (result.success) {
        toast.success(result.success);
        onClose();
      } else {
        toast.error(result.error || "خطا در ثبت لینک.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>مدیریت لینک جلسه آنلاین</DialogTitle>
          <DialogDescription>
            لینک ورود به جلسه (مانند Google Meet, Zoom, Skype) را برای این جلسه ثبت یا ویرایش کنید.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="meetingLink" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              لینک جلسه
            </Label>
            <Input
              id="meetingLink"
              type="url"
              placeholder="https://meet.google.com/..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            انصراف
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !link.trim()}>
            {isPending ? "در حال ذخیره..." : "ذخیره لینک"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};