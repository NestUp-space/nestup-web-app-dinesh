-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_engineerId_fkey";

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "engineerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
