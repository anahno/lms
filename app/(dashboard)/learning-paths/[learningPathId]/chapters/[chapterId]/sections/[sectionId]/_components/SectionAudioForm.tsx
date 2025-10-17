// فایل: app/(dashboard)/learning-paths/[learningPathId]/chapters/[chapterId]/sections/[sectionId]/_components/SectionAudioForm.tsx
"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Section } from "@prisma/client";
import { Pencil, PlusCircle, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SectionAudioFormProps {
  initialData: Section;
  learningPathId: string;
  chapterId: string;
  sectionId: string;
}

export const SectionAudioForm = ({
  initialData,
  learningPathId,
  chapterId,
  sectionId,
}: SectionAudioFormProps) => {
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
      // اینجا فیلد audioUrl را به‌روزرسانی می‌کنیم
      await axios.patch(`/api/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}`, {
        audioUrl: uploadResponse.data.url,
      });
      toast.success("فایل صوتی با موفقیت آپلود شد.");
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
        فایل صوتی بخش (اختیاری)
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing && "انصراف"}
          {!isEditing && !initialData.audioUrl && (
            <><PlusCircle className="h-4 w-4 ml-2" /> افزودن فایل صوتی</>
          )}
          {!isEditing && initialData.audioUrl && (
            <><Pencil className="h-4 w-4 ml-2" /> تغییر فایل صوتی</>
          )}
        </Button>
      </div>
      {!isEditing &&
        (!initialData.audioUrl ? (
          <div className="flex items-center justify-center h-40 bg-slate-200 rounded-md">
            <FileAudio className="h-10 w-10 text-slate-500" />
          </div>
        ) : (
          <div className="relative mt-2">
            <audio
              src={initialData.audioUrl}
              controls
              className="w-full h-14 rounded-md"
            />
          </div>
        ))}
      {isEditing && (
        <div className="mt-2">
          <Input
            type="file"
            accept="audio/*" // فقط فایل‌های صوتی را قبول می‌کند
            onChange={handleUpload}
            disabled={uploading}
          />
          <div className="text-xs text-muted-foreground mt-2">
            {uploading ? "در حال آپلود..." : "یک فایل صوتی را انتخاب کنید."}
          </div>
        </div>
      )}
    </div>
  );
};