// فایل: app/(dashboard)/learning-paths/[learningPathId]/chapters/[chapterId]/sections/[sectionId]/_components/SectionQuizForm.tsx
"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Section, Quiz } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, HelpCircle } from "lucide-react";

interface SectionQuizFormProps {
  initialData: Section & { quiz: Quiz | null };
  learningPathId: string;
  chapterId: string;
  sectionId: string;
}

export const SectionQuizForm = ({
  initialData,
  learningPathId,
  chapterId,
  sectionId,
}: SectionQuizFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const goToQuizPage = () => {
    router.push(`/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}/quiz`);
  };

  const onCreate = async () => {
    try {
      setIsCreating(true);
      // یک API جدید برای ایجاد آزمون صدا می‌زنیم
      await axios.post(`/api/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}/quiz`, {
        title: `آزمون بخش: ${initialData.title}`,
      });
      toast.success("آزمون با موفقیت ایجاد شد. اکنون سوالات را اضافه کنید.");
      goToQuizPage();
    } catch {
      toast.error("مشکلی در ایجاد آزمون پیش آمد.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        آزمون پایان بخش
        <Button onClick={initialData.quiz ? goToQuizPage : onCreate} variant="ghost" disabled={isCreating}>
          {isCreating ? (
            "در حال ایجاد..."
          ) : initialData.quiz ? (
            <><Pencil className="h-4 w-4 ml-2" /> ویرایش آزمون</>
          ) : (
            <><PlusCircle className="h-4 w-4 ml-2" /> افزودن آزمون</>
          )}
        </Button>
      </div>
      {!initialData.quiz && (
        <p className="text-sm mt-2 text-slate-500 italic">
          این بخش هنوز آزمونی ندارد.
        </p>
      )}
      {initialData.quiz && (
         <p className="text-sm mt-2 text-slate-500">
          برای مدیریت سوالات و تنظیمات این آزمون کلیک کنید.
        </p>
      )}
    </div>
  );
};