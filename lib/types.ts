// فایل: lib/types.ts

import { Level, Chapter, Section, UserProgress } from "@prisma/client";

export type ChapterWithSectionsAndProgress = Chapter & {
  sections: (Section & { progress: UserProgress[] })[];
};

export type LevelWithChapters = Level & {
  chapters: ChapterWithSectionsAndProgress[];
};

export type LearningPathWithStructure = {
  id: string;
  title: string;
  levels: LevelWithChapters[];
};