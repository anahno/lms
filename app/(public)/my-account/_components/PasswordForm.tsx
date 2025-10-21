"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios"; // ۱. مطمئن شوید axios ایمپورت شده باشد
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const formSchema = z.object({
  currentPassword: z.string().min(1, { message: "رمز عبور فعلی الزامی است." }),
  newPassword: z.string().min(6, { message: "رمز عبور جدید باید حداقل ۶ کاراکتر باشد." }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "رمز عبور جدید و تکرار آن یکسان نیستند.",
  path: ["confirmPassword"],
});

export const PasswordForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch("/api/account/password", values);
      toast.success("رمز عبور با موفقیت تغییر یافت.");
      form.reset();
    } catch (error) { // ۲. تایپ any از اینجا حذف شد
      // ۳. نوع خطا را به درستی بررسی می‌کنیم
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data || "مشکلی در تغییر رمز عبور پیش آمد.");
      } else {
        toast.error("یک خطای ناشناخته رخ داد.");
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>تغییر رمز عبور</CardTitle>
        <CardDescription>برای امنیت بیشتر، به طور دوره‌ای رمز عبور خود را تغییر دهید.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">رمز عبور فعلی</Label>
            <Input id="currentPassword" type="password" {...form.register("currentPassword")} disabled={isSubmitting} />
            {form.formState.errors.currentPassword && <p className="text-red-500 text-sm mt-1">{form.formState.errors.currentPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">رمز عبور جدید</Label>
            <Input id="newPassword" type="password" {...form.register("newPassword")} disabled={isSubmitting} />
            {form.formState.errors.newPassword && <p className="text-red-500 text-sm mt-1">{form.formState.errors.newPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">تکرار رمز عبور جدید</Label>
            <Input id="confirmPassword" type="password" {...form.register("confirmPassword")} disabled={isSubmitting} />
            {form.formState.errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{form.formState.errors.confirmPassword.message}</p>}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting ? "در حال تغییر..." : "تغییر رمز عبور"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};