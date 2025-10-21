-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS');

-- AlterTable
ALTER TABLE "LearningPath" ADD COLUMN     "level" "CourseLevel" DEFAULT 'ALL_LEVELS';
