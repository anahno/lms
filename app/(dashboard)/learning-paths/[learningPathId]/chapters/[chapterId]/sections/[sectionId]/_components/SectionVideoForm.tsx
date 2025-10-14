// فایل: .../sections/[sectionId]/_components/SectionVideoForm.tsx
"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Section } from "@prisma/client";
import { Pencil, PlusCircle, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SectionVideoFormProps {
  initialData: Section;
  learningPathId: string;
  chapterId: string;
  sectionId: string;
}

export const SectionVideoForm = ({
  initialData,
  learningPathId,
  chapterId,
  sectionId,
}: SectionVideoFormProps) => {
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
      await axios.patch(`/api/learning-paths/${learningPathId}/chapters/${chapterId}/sections/${sectionId}`, {
        videoUrl: uploadResponse.data.url,
      });
      toast.success("ویدیو با موفقیت آپلود شد.");
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
        ویدیوی بخش
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing && "انصراف"}
          {!isEditing && !initialData.videoUrl && (
            <><PlusCircle className="h-4 w-4 ml-2" /> افزودن ویدیو</>
          )}
          {!isEditing && initialData.videoUrl && (
            <><Pencil className="h-4 w-4 ml-2" /> تغییر ویدیو</>
          )}
        </Button>
      </div>
      {!isEditing &&
        (!initialData.videoUrl ? (
          <div className="flex items-center justify-center h-60 bg-slate-200 rounded-md">
            <Video className="h-10 w-10 text-slate-500" />
          </div>
        ) : (
          <div className="relative aspect-video mt-2">
            <video
              src={initialData.videoUrl}
              controls
              className="w-full h-full rounded-md"
            />
          </div>
        ))}
      {isEditing && (
        <div className="mt-2">
          <Input
            type="file"
            accept="video/*"
            onChange={handleUpload}
            disabled={uploading}
          />
          <div className="text-xs text-muted-foreground mt-2">
            {uploading ? "در حال آپلود..." : "یک فایل ویدیویی را انتخاب کنید."}
          </div>
        </div>
      )}
    </div>
  );
};
