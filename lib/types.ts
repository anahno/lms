// فایل: lib/types.ts
import { Level, Chapter, Section, UserProgress, Quiz } from "@prisma/client";

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
  slug: string; // +++ این خط اضافه شده است +++
  levels: LevelWithChapters[];
};