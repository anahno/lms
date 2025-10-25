// فایل: app/(dashboard)/.../quiz/_components/QuestionCard.tsx
"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Question, Option, QuestionType } from "@prisma/client";
import { Grip, Pencil, Trash, PlusCircle, Save, X, Square, Braces, Trash2, Image as ImageIcon, Video, Music, UploadCloud, Loader2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

type TextPart = { type: 'text'; content: string } | { type: 'blank'; id: string };

const formSchema = z.object({
  text: z.string().min(1, { message: "متن سوال الزامی است" }),
  points: z.number().min(1, { message: "امتیاز باید حداقل ۱ باشد" }),
  imageUrl: z.string().url().optional().or(z.literal("")),
  videoUrl: z.string().url().optional().or(z.literal("")),
  audioUrl: z.string().url().optional().or(z.literal("")),
  options: z.array(z.object({
    id: z.string().optional(),
    text: z.string().min(1, { message: "متن گزینه الزامی است" }),
    isCorrect: z.boolean(),
  })),
});

type QuestionWithWithOptions = Question & { options: Option[] };

interface QuestionCardProps {
  question: QuestionWithWithOptions;
  learningPathId: string;
  chapterId: string;
  sectionId: string;
}

const questionTypeInfo = {
    [QuestionType.SINGLE_CHOICE]: { text: "تک گزینه‌ای", className: "bg-sky-600" },
    [QuestionType.MULTIPLE_CHOICE]: { text: "چند گزینه‌ای", className: "bg-indigo-600" },
    [QuestionType.FILL_IN_THE_BLANK]: { text: "جای خالی", className: "bg-amber-600" },
    [QuestionType.ESSAY]: { text: "تشریحی", className: "bg-rose-600" },
    [QuestionType.AUDIO_RESPONSE]: { text: "پاسخ صوتی", className: "bg-teal-600" },
    [QuestionType.DRAG_INTO_TEXT]: { text: "کشیدن در متن", className: "bg-purple-600" },
}

// کامپوننت جدید با نمایش پیشرفت آپلود
const MediaInput = ({ 
  label, 
  icon: Icon, 
  value, 
  onChange, 
  onUpload, 
  uploadProgress,
  isUploading 
}: {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadProgress: number;
  isUploading: boolean;
}) => (
  <div className="space-y-2">
    <Label className="flex items-center gap-2"><Icon className="w-4 h-4" /> {label}</Label>
    <div className="flex items-center gap-2">
      <Input
        type="url"
        placeholder="لینک خارجی را اینجا وارد کنید"
        className="bg-white"
        value={value}
        onChange={onChange}
        disabled={isUploading}
      />
      <span className="text-xs text-muted-foreground">یا</span>
      <Button asChild variant="outline" size="sm" className="whitespace-nowrap min-w-[100px]" disabled={isUploading}>
        <label className={cn(isUploading && "cursor-not-allowed opacity-50")}>
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              {uploadProgress}%
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4 ml-2" />
              آپلود
            </>
          )}
          <input 
            type="file" 
            className="hidden" 
            onChange={onUpload} 
            disabled={isUploading}
            accept={
              label === "تصویر" ? "image/*" : 
              label === "ویدیو" ? "video/*" : 
              "audio/*"
            }
          />
        </label>
      </Button>
    </div>
    {isUploading && (
      <Progress value={uploadProgress} className="h-2" />
    )}
  </div>
);

export const QuestionCard = ({
  question,
  learningPathId,
  chapterId,
  sectionId,
}: QuestionCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : "auto" };
  
  const [textParts, setTextParts] = useState<TextPart[]>(() => {
    try {
      return question.description ? JSON.parse(question.description) : [];
    } catch {
      return [{ type: 'text', content: 'ساختار متن نامعتبر است.' }];
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: question.text,
      points: question.points,
      imageUrl: question.imageUrl || "",
      videoUrl: question.videoUrl || "",
      audioUrl: question.audioUrl || "",
      options: question.options.map(o => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "options" });
  const { isSubmitting, isValid } = form.formState;

  const toggleEdit = () => {
    setIsEditing(prev => !prev);
    if (!isEditing) {
        form.reset({
            text: question.text,
            points: question.points,
            imageUrl: question.imageUrl || "",
            videoUrl: question.videoUrl || "",
            audioUrl: question.audioUrl || "",
            options: question.options.map(o => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
        });
        try {
          setTextParts(question.description ? JSON.parse(question.description) : []);
        } catch {
          setTextParts([]);
        }
    }
  };
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if(question.type === QuestionType.DRAG_INTO_TEXT) {
        const blankCount = textParts.filter(p => p.type === 'blank').length;
        const correctOptionsCount = values.options.filter(o => o.isCorrect).length;
        if (blankCount !== correctOptionsCount) {
          toast.error(`تعداد جاهای خالی (${blankCount}) باید با تعداد گزینه‌های صحیح (${correctOptionsCount}) برابر باشد.`);
          return;
        }
      }

      const dataToSend = {
        ...values,
        description: question.type === QuestionType.DRAG_INTO_TEXT ? JSON.stringify(textParts) : null,
      };
      await axios.patch(`/api/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}/quiz/questions/${question.id}`, dataToSend);
      toast.success("سوال با موفقیت به‌روزرسانی شد.");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("مشکلی در ذخیره سوال پیش آمد.");
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

  // تابع بهبود یافته برای مدیریت آپلود با نمایش پیشرفت
  const handleFileUpload = async (file: File, field: "imageUrl" | "videoUrl" | "audioUrl") => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await axios.post("/api/upload", formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(percentCompleted);
        },
      });
      
      form.setValue(field, response.data.url, { shouldValidate: true });
      toast.success("فایل با موفقیت آپلود شد.");
    } catch (error) {
      toast.error("خطا در آپلود فایل.");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  const handleAddTextPart = (type: 'text' | 'blank') => {
    if (type === 'blank') {
      const newBlankId = `blank-${Date.now()}`;
      setTextParts([...textParts, { type: 'blank', id: newBlankId }]);
    } else {
      setTextParts([...textParts, { type: 'text', content: '' }]);
    }
  };

  const handleTextPartChange = (index: number, content: string) => {
    const newParts = [...textParts];
    const part = newParts[index];
    if (part.type === 'text') {
      part.content = content;
      setTextParts(newParts);
    }
  };
  
  const handleRemoveTextPart = (index: number) => {
    setTextParts(textParts.filter((_, i) => i !== index));
  };

  const isChoiceQuestion = question.type === QuestionType.SINGLE_CHOICE || question.type === QuestionType.MULTIPLE_CHOICE;
  const isDragIntoTextQuestion = question.type === QuestionType.DRAG_INTO_TEXT;
  const correctAnswerForBlank = question.options.find(o => o.isCorrect)?.text;
  const typeInfo = questionTypeInfo[question.type];

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="relative overflow-hidden flex flex-col gap-y-2 bg-slate-200 border-slate-300 border text-slate-700 rounded-md">
        
        {typeInfo && (
            <div className={cn("absolute top-0 right-0 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10", typeInfo.className)}>
                {typeInfo.text}
            </div>
        )}

        <div className="flex items-center gap-x-2 px-3 pb-3 pt-8 font-medium border-b bg-slate-200">
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <Label htmlFor={`text-${question.id}`}>عنوان کلی سوال (راهنما)</Label>
                   <Textarea id={`text-${question.id}`} {...form.register("text")} disabled={isSubmitting} className="mt-1 bg-white" />
                  {form.formState.errors.text && <p className="text-red-500 text-xs mt-1">{form.formState.errors.text.message}</p>}
                </div>
                <div>
                  <Label htmlFor={`points-${question.id}`}>امتیاز</Label>
                  <Input id={`points-${question.id}`} type="number" {...form.register("points", { valueAsNumber: true })} disabled={isSubmitting} className="mt-1 bg-white" />
                  {form.formState.errors.points && <p className="text-red-500 text-xs mt-1">{form.formState.errors.points.message}</p>}
                </div>
              </div>
              
              {/* بخش افزودن رسانه با نمایش پیشرفت */}
              <div className="space-y-4 p-4 border rounded-md bg-slate-100">
                <h4 className="text-sm font-semibold">افزودن رسانه (اختیاری)</h4>
                <MediaInput
                    label="تصویر"
                    icon={ImageIcon}
                    value={form.watch("imageUrl") || ""}
                    onChange={(e) => form.setValue("imageUrl", e.target.value)}
                    onUpload={(e) => e.target.files && handleFileUpload(e.target.files[0], "imageUrl")}
                    uploadProgress={uploadProgress}
                    isUploading={isUploading}
                />
                <MediaInput
                    label="ویدیو"
                    icon={Video}
                    value={form.watch("videoUrl") || ""}
                    onChange={(e) => form.setValue("videoUrl", e.target.value)}
                    onUpload={(e) => e.target.files && handleFileUpload(e.target.files[0], "videoUrl")}
                    uploadProgress={uploadProgress}
                    isUploading={isUploading}
                />
                <MediaInput
                    label="فایل صوتی"
                    icon={Music}
                    value={form.watch("audioUrl") || ""}
                    onChange={(e) => form.setValue("audioUrl", e.target.value)}
                    onUpload={(e) => e.target.files && handleFileUpload(e.target.files[0], "audioUrl")}
                    uploadProgress={uploadProgress}
                    isUploading={isUploading}
                />
              </div>

              {isDragIntoTextQuestion ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>ساختار متن سوال</Label>
                    <div className="p-2 border rounded-md bg-white space-y-2">
                      {textParts.map((part, index) => (
                        <div key={index} className="flex items-center gap-x-2">
                          {part.type === 'text' ? (
                            <Textarea
                              value={part.content}
                              onChange={(e) => handleTextPartChange(index, e.target.value)}
                              placeholder="متن را اینجا بنویسید..."
                              className="flex-1"
                            />
                          ) : (
                            <div className="flex-1 p-2 bg-sky-100 border border-dashed border-sky-400 rounded-md text-center text-sm font-semibold text-sky-700">
                              جای خالی
                            </div>
                          )}
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveTextPart(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-x-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => handleAddTextPart('text')}><Square className="w-4 h-4 ml-2"/> افزودن متن</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => handleAddTextPart('blank')}><Braces className="w-4 h-4 ml-2"/> افزودن جای خالی</Button>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                      <Label>گزینه‌های کشیدنی</Label>
                      <p className="text-xs text-muted-foreground">گزینه‌هایی که پاسخ صحیح هستند را تیک بزنید (باید به تعداد جاهای خالی باشد).</p>
                      <div className="space-y-2 mt-1">
                          {fields.map((field, index) => (
                              <div key={field.id} className="flex items-center gap-x-2">
                                  <Controller
                                      control={form.control}
                                      name={`options.${index}.isCorrect`}
                                      render={({ field: checkboxField }) => (
                                          <Checkbox checked={checkboxField.value} onCheckedChange={checkboxField.onChange} />
                                      )}
                                  />
                                  <Input {...form.register(`options.${index}.text`)} placeholder={`متن گزینه ${index + 1}`}/>
                                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                                      <Trash className="h-4 w-4 text-red-500" />
                                  </Button>
                              </div>
                          ))}
                          <Button type="button" variant="ghost" size="sm" onClick={() => append({ text: "", isCorrect: false })}>
                              <PlusCircle className="h-4 w-4 ml-2" /> افزودن گزینه
                          </Button>
                      </div>
                  </div>
                </div>
              ) : isChoiceQuestion ? (
                <div>
                  <Label>گزینه‌ها</Label>
                  <div className="space-y-2 mt-1">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-x-2">
                        <Controller
                          control={form.control}
                          name={`options.${index}.isCorrect`}
                          render={({ field: checkboxField }) => (
                            <Checkbox checked={checkboxField.value} onCheckedChange={checkboxField.onChange} disabled={isSubmitting} className="bg-white" />
                          )}
                        />
                        <Input {...form.register(`options.${index}.text`)} disabled={isSubmitting} className="bg-white" />
                        <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} disabled={isSubmitting}>
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {form.formState.errors.options && <p className="text-red-500 text-xs mt-1">{form.formState.errors.options.root?.message}</p>}
                  <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => append({ text: "", isCorrect: false })}>
                    <PlusCircle className="h-4 w-4 ml-2" /> افزودن گزینه
                  </Button>
                </div>
              ) : (
                <div>
                    <Label htmlFor={`correct-answer-${question.id}`}>پاسخ صحیح</Label>
                    <Input id={`correct-answer-${question.id}`} {...form.register(`options.0.text`)} disabled={isSubmitting} className="mt-1 bg-white" placeholder="مثال: تهران"/>
                    <p className="text-xs text-muted-foreground mt-1">سیستم پاسخ کاربر را بدون در نظر گرفتن بزرگی و کوچکی حروف و فاصله‌های اضافی ابتدا و انتها، مقایسه می‌کند.</p>
                </div>
              )}
              
              <div className="flex items-center justify-end gap-x-2">
                <Button type="button" variant="ghost" onClick={toggleEdit}>انصراف</Button>
                <Button type="submit" disabled={isSubmitting || !isValid || isUploading}>
                  <Save className="h-4 w-4 ml-2" /> ذخیره
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* پیش‌نمایش رسانه */}
              {question.imageUrl && <div className="relative aspect-video rounded-md overflow-hidden"><Image src={question.imageUrl} alt="Question Image" fill className="object-contain" /></div>}
              {question.videoUrl && <video src={question.videoUrl} controls className="w-full rounded-md" />}
              {question.audioUrl && <audio src={question.audioUrl} controls className="w-full" />}
              
              <p className="font-semibold">{question.text}</p>
              <p className="text-xs text-slate-500">امتیاز: {question.points}</p>

              {isDragIntoTextQuestion ? (
                <div className="space-y-2 pt-2">
                  <div className="p-2 border rounded-md bg-slate-50">
                    {textParts.map((part, index) => (
                      part.type === 'text' ? (
                        <span key={index}>{part.content}</span>
                      ) : (
                        <span key={index} className="font-bold text-sky-600">[ جای خالی ]</span>
                      )
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">گزینه‌های صحیح:</p>
                    <ul className="list-disc pr-5 space-y-1 text-sm text-emerald-700">
                      {question.options.filter(o => o.isCorrect).map(opt => <li key={opt.id}>{opt.text}</li>)}
                    </ul>
                  </div>
                </div>
              ) : isChoiceQuestion ? (
                <ul className="list-disc pr-5 space-y-1">
                  {question.options.map(opt => (
                    <li key={opt.id} className={cn("text-sm", opt.isCorrect && "font-bold text-emerald-700")}>{opt.text}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-bold text-emerald-700">پاسخ صحیح: {correctAnswerForBlank || "ثبت نشده"}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};