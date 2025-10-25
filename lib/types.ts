// فایل: lib/types.ts
import { Level, Chapter, Section, UserProgress, Quiz, User } from "@prisma/client";

export type SectionWithProgressAndQuiz = Section & {
  progress: UserProgress[];
  quiz: Quiz | null;
};

export type ChapterWithSectionsAndProgress = Chapter & {
  sections: SectionWithProgressAndQuiz[];
};

export type LevelWithChapters = Level & {
  chapters: ChapterWithSectionsAndProgress[];
};

export type LearningPathWithStructure = {
  id: string;
  title: string;
  slug: string; 
  levels: LevelWithChapters[];
  // +++ شروع تغییر +++
  user: User; // اطلاعات کامل مدرس را به این تایپ اضافه می‌کنیم
  // +++ پایان تغییر +++
};