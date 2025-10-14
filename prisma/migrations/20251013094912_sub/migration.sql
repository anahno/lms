/*
  Warnings:

  - You are about to drop the column `description` on the `Chapter` table. All the data in the column will be lost.
  - You are about to drop the column `isFree` on the `Chapter` table. All the data in the column will be lost.
  - You are about to drop the column `learningPathId` on the `Chapter` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `Chapter` table. All the data in the column will be lost.
  - You are about to drop the column `chapterId` on the `UserProgress` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,sectionId]` on the table `UserProgress` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `levelId` to the `Chapter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sectionId` to the `UserProgress` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Chapter" DROP CONSTRAINT "Chapter_learningPathId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserProgress" DROP CONSTRAINT "UserProgress_chapterId_fkey";

-- DropIndex
DROP INDEX "public"."UserProgress_userId_chapterId_key";

-- AlterTable
ALTER TABLE "Chapter" DROP COLUMN "description",
DROP COLUMN "isFree",
DROP COLUMN "learningPathId",
DROP COLUMN "videoUrl",
ADD COLUMN     "levelId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserProgress" DROP COLUMN "chapterId",
ADD COLUMN     "sectionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Level" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "learningPathId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT,
    "position" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "chapterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProgress_userId_sectionId_key" ON "UserProgress"("userId", "sectionId");

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
