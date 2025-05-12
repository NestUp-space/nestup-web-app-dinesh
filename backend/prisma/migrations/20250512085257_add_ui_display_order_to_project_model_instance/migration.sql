/*
  Warnings:

  - Made the column `uiDisplayOrder` on table `ProjectModelInstance` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ProjectModelInstance" ALTER COLUMN "uiDisplayOrder" SET NOT NULL;
