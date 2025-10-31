// فایل کامل و اصلاح شده: app/(dashboard)/categories/_components/CategoryClient.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // ۱. useRouter برای رفرش کردن داده‌های سرور ایمپورت شد
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import toast from "react-hot-toast";
import { Category } from "@prisma/client";
import { PlusCircle, Pencil, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

const formSchema = z.object({
  name: z.string().min(1, { message: "نام الزامی است" }),
  parentId: z.string().optional(),
});

type CategoryWithSubcategories = Category & { subcategories: Category[] };

interface CategoryClientProps {
  initialData: CategoryWithSubcategories[];
}

const ROOT_CATEGORY_VALUE = "_root_";

export const CategoryClient = ({ initialData }: CategoryClientProps) => {
  const router = useRouter(); // ۲. هوک روتر برای فراخوانی refresh
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  // ۳. دیگر نیازی به state جداگانه برای categories نداریم و مستقیماً از initialData استفاده می‌کنیم.
  // const [categories, setCategories] = useState(initialData);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", parentId: ROOT_CATEGORY_VALUE },
  });

  const { isSubmitting } = form.formState;

  const handleOpenModal = (category: Category | null = null) => {
    setEditingCategory(category);
    if (category) {
      form.reset({ name: category.name, parentId: category.parentId || ROOT_CATEGORY_VALUE });
    } else {
      form.reset({ name: "", parentId: ROOT_CATEGORY_VALUE });
    }
    setOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const submissionData = {
        name: values.name,
        parentId: values.parentId === ROOT_CATEGORY_VALUE ? null : values.parentId,
      };

      if (editingCategory) {
        // ویرایش
        await axios.patch(`/api/categories/${editingCategory.id}`, submissionData);
        toast.success("دسته‌بندی ویرایش شد.");
      } else {
        // ایجاد
        await axios.post("/api/categories", submissionData);
        toast.success("دسته‌بندی جدید ایجاد شد.");
      }
      
      router.refresh(); // ۴. مهم‌ترین بخش: به Next.js می‌گوییم داده‌های این مسیر را دوباره از سرور واکشی کند
      setOpen(false);
      form.reset();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          toast.error("دسته‌بندی با این نام قبلاً ایجاد شده است.");
        } else if (error.response?.status === 400) {
          toast.error(error.response.data || "درخواست نامعتبر است.");
        } else {
          toast.error("مشکلی از سمت سرور پیش آمد.");
        }
      } else {
        toast.error("یک خطای ناشناخته رخ داد.");
        console.error(error);
      }
    }
  };

  const onDelete = async (categoryId: string) => {
    try {
      await axios.delete(`/api/categories/${categoryId}`);
      toast.success("دسته‌بندی حذف شد.");
      router.refresh(); // ۵. پس از حذف هم داده‌ها را رفرش می‌کنیم
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          toast.error(error.response.data || "نمی‌توان این دسته‌بندی را حذف کرد.");
        } else {
          toast.error("مشکلی در حذف پیش آمد.");
        }
      } else {
        toast.error("مشکلی در حذف پیش آمد.");
      }
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت دسته‌بندی‌ها</h1>
        <Button onClick={() => handleOpenModal()}>
          <PlusCircle className="h-4 w-4 ml-2" />
          افزودن دسته‌بندی
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "ویرایش" : "ایجاد"} دسته‌بندی</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div>
              <Label htmlFor="name">نام دسته‌بندی</Label>
              <Input id="name" {...form.register("name")} disabled={isSubmitting} />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="parentId">دسته‌بندی والد (اختیاری)</Label>
              <Select
                onValueChange={(value) => form.setValue("parentId", value)}
                value={form.watch("parentId")}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب کنید..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROOT_CATEGORY_VALUE}>- اصلی (بدون والد) -</SelectItem>
                  {/* ۶. برای نمایش لیست دسته‌بندی‌ها از initialData استفاده می‌کنیم */}
                  {initialData
                    .filter(cat => cat.id !== editingCategory?.id)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {form.formState.errors.parentId && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.parentId.message}</p>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      
      <div className="mt-8 space-y-4">
        {initialData.length === 0 ? (
          <p className="text-center text-gray-500 py-8">هیچ دسته‌بندی وجود ندارد</p>
        ) : (
          initialData.map(category => (
            <div key={category.id} className="p-4 border rounded-lg bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="font-bold">{category.name}</span>
                <div className="flex items-center gap-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenModal(category)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <ConfirmModal onConfirm={() => onDelete(category.id)}>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </ConfirmModal>
                </div>
              </div>
              {category.subcategories.length > 0 && (
                <div className="mt-2 pr-6 space-y-2">
                  {category.subcategories.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-2 border-r-2">
                      <span>{sub.name}</span>
                      <div className="flex items-center gap-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(sub)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <ConfirmModal onConfirm={() => onDelete(sub.id)}>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash className="w-4 h-4" />
                          </Button>
                        </ConfirmModal>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
};