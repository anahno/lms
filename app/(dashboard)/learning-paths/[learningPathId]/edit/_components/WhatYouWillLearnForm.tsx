// فایل: .../edit/_components/WhatYouWillLearnForm.tsx
"use client";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { LearningPath } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, CheckCircle } from "lucide-react";

interface WhatYouWillLearnFormProps {
  initialData: LearningPath;
  learningPathId: string;
}

export const WhatYouWillLearnForm = ({ initialData, learningPathId }: WhatYouWillLearnFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [learnItems, setLearnItems] = useState(initialData.whatYouWillLearn.join('\n'));
  const router = useRouter();

  const toggleEdit = () => setIsEditing((current) => !current);

  const onSubmit = async () => {
    try {
      const whatYouWillLearn = learnItems.split('\n').filter(item => item.trim() !== '');
      await axios.patch(`/api/learning-paths/${learningPathId}`, { whatYouWillLearn });
      toast.success("لیست با موفقیت به‌روزرسانی شد.");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("مشکلی پیش آمد.");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        آنچه خواهید آموخت
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? "انصراف" : <><Pencil className="h-4 w-4 ml-2" /> ویرایش</>}
        </Button>
      </div>
      {!isEditing && (
        initialData.whatYouWillLearn.length === 0 ? (
          <p className="text-sm mt-2 text-slate-500 italic">هنوز موردی ثبت نشده</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {initialData.whatYouWillLearn.map((item, index) => (
              <li key={index} className="flex items-center gap-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                {item}
              </li>
            ))}
          </ul>
        )
      )}
      {isEditing && (
        <div className="space-y-4 mt-4">
          <Textarea
            placeholder="هر مورد را در یک خط جدید وارد کنید..."
            value={learnItems}
            onChange={(e) => setLearnItems(e.target.value)}
            className="min-h-[150px]"
          />
          <Button onClick={onSubmit}>ذخیره</Button>
        </div>
      )}
    </div>
  );
};