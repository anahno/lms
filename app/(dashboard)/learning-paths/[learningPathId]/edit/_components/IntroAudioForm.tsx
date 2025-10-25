// فایل: app/(dashboard)/learning-paths/[learningPathId]/edit/_components/IntroAudioForm.tsx
"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { LearningPath } from "@prisma/client";
import { Pencil, PlusCircle, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface IntroAudioFormProps {
  initialData: LearningPath;
  learningPathId: string;
}

export const IntroAudioForm = ({
  initialData,
  learningPathId,
}: IntroAudioFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const toggleEdit = () => setIsEditing((current) => !current);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadResponse = await axios.post("/api/upload", formData);
      // اینجا فیلد introAudioUrl را در خود LearningPath به‌روزرسانی می‌کنیم
      await axios.patch(`/api/learning-paths/${learningPathId}`, {
        introAudioUrl: uploadResponse.data.url,
      });
      toast.success("فایل صوتی معرفی با موفقیت آپلود شد.");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("آپلود با خطا مواجه شد.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        <div className="flex items-center gap-x-2">
            <FileAudio className="h-5 w-5 text-[#00a7f5]" />
            فایل صوتی معرفی دوره (اختیاری)
        </div>
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing && "انصراف"}
          {!isEditing && !initialData.introAudioUrl && (
            <><PlusCircle className="h-4 w-4 ml-2" /> افزودن فایل صوتی</>
          )}
          {!isEditing && initialData.introAudioUrl && (
            <><Pencil className="h-4 w-4 ml-2" /> تغییر فایل صوتی</>
          )}
        </Button>
      </div>
      {!isEditing &&
        (!initialData.introAudioUrl ? (
          <div className="flex items-center justify-center h-40 bg-slate-200 rounded-md">
            <FileAudio className="h-10 w-10 text-slate-500" />
          </div>
        ) : (
          <div className="relative mt-2">
            <audio
              src={initialData.introAudioUrl}
              controls
              className="w-full h-14 rounded-md"
            />
          </div>
        ))}
      {isEditing && (
        <div className="mt-2">
          <Input
            type="file"
            accept="audio/*"
            onChange={handleUpload}
            disabled={uploading}
          />
          <div className="text-xs text-muted-foreground mt-2">
            {uploading ? "در حال آپلود..." : "پیشنهاد می‌شود فایل صوتی توضیح نحوه مطالعه این مسیر یادگیری در اینجا آپلود شود."}
          </div>
        </div>
      )}
    </div>
  );
};