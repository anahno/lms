// فایل: lib/types.ts
import { Level, Chapter, Section, UserProgress, Quiz } from "@prisma/client";

// --- تایپ Section را به‌روز کنید ---
export type SectionWithProgressAndQuiz = Section & {
  progress: UserProgress[];
  quiz: Quiz | null; // <-- این خط اضافه شد
};

// --- تایپ Chapter را برای استفاده از تایپ جدید به‌روز کنید ---
export type ChapterWithSectionsAndProgress = Chapter & {
  sections: SectionWithProgressAndQuiz[]; // <-- این خط تغییر کرد
};

export type LevelWithChapters = Level & {
  chapters: ChapterWithSectionsAndProgress[];
};

export type LearningPathWithStructure = {
  id: string;
  title: string;
  levels: LevelWithChapters[];
};