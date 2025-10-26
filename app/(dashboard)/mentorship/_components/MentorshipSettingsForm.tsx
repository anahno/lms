// فایل: app/(dashboard)/mentorship/_components/MentorshipSettingsForm.tsx
"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MentorProfile } from "@prisma/client";
import { updateMentorProfile } from "@/actions/mentorship-actions";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  isEnabled: z.boolean(),
  hourlyRate: z.coerce.number().min(0, "قیمت نمی‌تواند منفی باشد.").optional(),
  mentorshipDescription: z.string().optional(),
});

interface MentorshipSettingsFormProps {
  initialData: MentorProfile | null;
}

export const MentorshipSettingsForm = ({ initialData }: MentorshipSettingsFormProps) => {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isEnabled: initialData?.isEnabled || false,
      hourlyRate: initialData?.hourlyRate || undefined,
      mentorshipDescription: initialData?.mentorshipDescription || "",
    },
  });
  
  const { isDirty } = form.formState;
  const isEnabled = form.watch("isEnabled");

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      const result = await updateMentorProfile(values);
      if (result.success) {
        toast.success(result.success);
        form.reset(values); // Reset form state to make isDirty false
      } else {
        toast.error(result.error || "خطایی رخ داد.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>تنظیمات اصلی منتورشیپ</CardTitle>
        <CardDescription>وضعیت کلی، قیمت‌گذاری و توضیحات پروفایل منتورشیپ خود را مشخص کنید.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
            <Label htmlFor="isEnabled" className="text-lg font-semibold">فعال‌سازی قابلیت منتورشیپ</Label>
            <Switch
              id="isEnabled"
              checked={isEnabled}
              onCheckedChange={(checked) => form.setValue("isEnabled", checked, { shouldDirty: true })}
            />
          </div>

          {isEnabled && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">هزینه هر ساعت مشاوره (به تومان)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  placeholder="مثال: 250000"
                  {...form.register("hourlyRate")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mentorshipDescription">توضیحات (در صفحه پروفایل شما نمایش داده می‌شود)</Label>
                <Textarea
                  id="mentorshipDescription"
                  placeholder="درباره حوزه‌هایی که در آن مشاوره می‌دهید، تجربیات و نحوه برگزاری جلسات توضیح دهید..."
                  rows={5}
                  {...form.register("mentorshipDescription")}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending || !isDirty}>
              {isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};