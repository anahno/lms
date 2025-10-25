/*
  Warnings:

  - You are about to drop the column `mediaUrl` on the `Question` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Question" DROP COLUMN "mediaUrl",
ADD COLUMN     "audioUrl" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "videoUrl" TEXT;
