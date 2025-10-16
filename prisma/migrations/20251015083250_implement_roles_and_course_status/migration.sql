/*
  Warnings:

  - You are about to drop the column `isPublished` on the `LearningPath` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'INSTRUCTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED');

-- AlterTable
ALTER TABLE "LearningPath" DROP COLUMN "isPublished",
ADD COLUMN     "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
