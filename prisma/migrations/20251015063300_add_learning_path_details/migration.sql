-- AlterTable
ALTER TABLE "LearningPath" ADD COLUMN     "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "subtitle" TEXT,
ADD COLUMN     "whatYouWillLearn" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "duration" INTEGER;
