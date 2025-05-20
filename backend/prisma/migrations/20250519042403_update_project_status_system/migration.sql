/*
  Warnings:

  - A unique constraint covering the columns `[designerId,projectId]` on the table `DesignerProjectMapping` will be added. If there are existing duplicate values, this will fail.
  - Made the column `statusId` on table `Project` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_designerId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_projectManagerId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_statusId_fkey";

-- DropIndex
DROP INDEX "idx_project_designer";

-- DropIndex
DROP INDEX "idx_project_project_manager";

-- Drop constraint instead of index as per error hint
ALTER TABLE "UserPermission" DROP CONSTRAINT IF EXISTS "UserPermission_permission_key";

-- AlterTable
ALTER TABLE "DesignerProjectMapping" RENAME CONSTRAINT "ClientProjectMapping_pkey" TO "DesignerProjectMapping_pkey";

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "statusId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DesignerProjectMapping_designerId_projectId_key" ON "DesignerProjectMapping"("designerId", "projectId");

-- RenameForeignKey
ALTER TABLE "DesignerProjectMapping" RENAME CONSTRAINT "ClientProjectMapping_clientId_fkey" TO "DesignerProjectMapping_designerId_fkey";

-- RenameForeignKey
ALTER TABLE "DesignerProjectMapping" RENAME CONSTRAINT "ClientProjectMapping_projectId_fkey" TO "DesignerProjectMapping_projectId_fkey";

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_projectManagerId_fkey" FOREIGN KEY ("projectManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
