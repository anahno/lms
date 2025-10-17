// فایل: app/(dashboard)/.../quiz/_components/QuestionCard.tsx (نسخه اصلاح شده)
"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Question, Option } from "@prisma/client";
import { Grip, Pencil, Trash, PlusCircle, Save, X } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { Label } from "@/components/ui/label"; // <-- ایمپورت جدید

// --- شروع تغییر ۱: اصلاح Schema ---
const formSchema = z.object({
  text: z.string().min(1, { message: "متن سوال الزامی است" }),
  // z.coerce.number() به z.number() تغییر کرد
  points: z.number().min(1, { message: "امتیاز باید حداقل ۱ باشد" }),
  options: z.array(z.object({
    text: z.string().min(1, { message: "متن گزینه الزامی است" }),
    isCorrect: z.boolean(),
  })).min(2, { message: "حداقل دو گزینه لازم است" })
   .refine(options => options.some(opt => opt.isCorrect), {
     message: "حداقل یک گزینه باید به عنوان پاسخ صحیح انتخاب شود",
   }),
});
// --- پایان تغییر ۱ ---

type QuestionWithWithOptions = Question & { options: Option[] };

interface QuestionCardProps {
  question: QuestionWithWithOptions;
  learningPathId: string;
  chapterId: string;
  sectionId: string;
}

export const QuestionCard = ({
  question,
  learningPathId,
  chapterId,
  sectionId,
}: QuestionCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : "auto" };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: question.text,
      points: question.points,
      options: question.options.map(o => ({ text: o.text, isCorrect: o.isCorrect })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const { isSubmitting, isValid } = form.formState;

  const toggleEdit = () => {
    setIsEditing(prev => !prev);
    if (isEditing) form.reset();
  };
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}/quiz/questions/${question.id}`, values);
      toast.success("سوال با موفقیت به‌روزرسانی شد.");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("مشکلی پیش آمد.");
    }
  };
  
  const onDelete = async () => {
    try {
      await axios.delete(`/api/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}/quiz/questions/${question.id}`);
      toast.success("سوال حذف شد.");
      router.refresh();
    } catch {
      toast.error("مشکلی در حذف سوال پیش آمد.");
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex flex-col gap-y-2 bg-slate-200 border-slate-300 border text-slate-700 rounded-md">
        <div className="flex items-center gap-x-2 p-3 font-medium border-b bg-slate-200">
          <div {...listeners} className="cursor-grab p-1 rounded-sm hover:bg-slate-300 transition">
            <Grip className="h-5 w-5 text-slate-500" />
          </div>
          <p className="flex-1">سوال {question.position}</p>
          <div className="ml-auto flex items-center gap-x-2">
            <Button variant="ghost" size="sm" onClick={toggleEdit}>
              {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </Button>
            <ConfirmModal onConfirm={onDelete}>
              <Button size="sm" variant="ghost">
                <Trash className="h-4 w-4 text-red-600" />
              </Button>
            </ConfirmModal>
          </div>
        </div>
        
        <div className="p-4">
          {isEditing ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <Label htmlFor={`text-${question.id}`}>متن سوال</Label>
                  <Textarea id={`text-${question.id}`} {...form.register("text")} disabled={isSubmitting} className="mt-1 bg-white" />
                  {form.formState.errors.text && <p className="text-red-500 text-xs mt-1">{form.formState.errors.text.message}</p>}
                </div>
                {/* --- شروع تغییر ۲: اضافه کردن فیلد امتیاز --- */}
                <div>
                  <Label htmlFor={`points-${question.id}`}>امتیاز</Label>
                  <Input
                    id={`points-${question.id}`}
                    type="number"
                    // valueAsNumber: true تضمین می‌کند که یک عدد به Zod ارسال شود
                    {...form.register("points", { valueAsNumber: true })}
                    disabled={isSubmitting}
                    className="mt-1 bg-white"
                  />
                  {form.formState.errors.points && <p className="text-red-500 text-xs mt-1">{form.formState.errors.points.message}</p>}
                </div>
                {/* --- پایان تغییر ۲ --- */}
              </div>
              
              <div>
                <Label>گزینه‌ها</Label>
                <div className="space-y-2 mt-1">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-x-2">
                      <Controller
                        control={form.control}
                        name={`options.${index}.isCorrect`}
                        render={({ field: checkboxField }) => (
                          <Checkbox
                            checked={checkboxField.value}
                            onCheckedChange={checkboxField.onChange}
                            disabled={isSubmitting}
                          />
                        )}
                      />
                      <Input {...form.register(`options.${index}.text`)} disabled={isSubmitting} className="bg-white" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} disabled={isSubmitting}>
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
                {form.formState.errors.options && <p className="text-red-500 text-xs mt-1">{form.formState.errors.options.message || form.formState.errors.options.root?.message}</p>}
                <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => append({ text: "", isCorrect: false })}>
                  <PlusCircle className="h-4 w-4 ml-2" /> افزودن گزینه
                </Button>
              </div>
              
              <div className="flex items-center justify-end gap-x-2">
                <Button type="button" variant="ghost" onClick={toggleEdit}>انصراف</Button>
                <Button type="submit" disabled={isSubmitting || !isValid}>
                  <Save className="h-4 w-4 ml-2" /> ذخیره
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              <p className="font-semibold" dangerouslySetInnerHTML={{ __html: question.text }} />
              <p className="text-xs text-slate-500">امتیاز: {question.points}</p>
              <ul className="list-disc pr-5 space-y-1">
                {question.options.map(opt => (
                  <li key={opt.id} className={opt.isCorrect ? "font-bold text-emerald-700" : ""}>
                    {opt.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};