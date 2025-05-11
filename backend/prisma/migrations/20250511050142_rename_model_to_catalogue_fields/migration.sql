/*
  Warnings:

  - You are about to drop the column `modelDefinitionId` on the `CatalogueItemBomItem` table. All the data in the column will be lost.
  - You are about to drop the column `modelDefinitionId` on the `CatalogueItemInputParameter` table. All the data in the column will be lost.
  - You are about to drop the column `projectModelInstanceId` on the `GeneratedPlankList` table. All the data in the column will be lost.
  - You are about to drop the column `modelDefinitionId` on the `ProjectCatalogueItemInstance` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[catalogueItemDefinitionId,itemName]` on the table `CatalogueItemBomItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[catalogueItemDefinitionId,inputName]` on the table `CatalogueItemInputParameter` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `catalogueItemDefinitionId` to the `CatalogueItemBomItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `catalogueItemDefinitionId` to the `CatalogueItemInputParameter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectCatalogueItemInstanceId` to the `GeneratedPlankList` table without a default value. This is not possible if the table is not empty.
  - Added the required column `catalogueItemDefinitionId` to the `ProjectCatalogueItemInstance` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CatalogueItemBomItem" DROP CONSTRAINT "CatalogueItemBomItem_modelDefinitionId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogueItemInputParameter" DROP CONSTRAINT "CatalogueItemInputParameter_modelDefinitionId_fkey";

-- DropForeignKey
ALTER TABLE "GeneratedPlankList" DROP CONSTRAINT "GeneratedPlankList_projectModelInstanceId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectCatalogueItemInstance" DROP CONSTRAINT "ProjectCatalogueItemInstance_modelDefinitionId_fkey";

-- DropIndex
DROP INDEX "CatalogueItemBomItem_modelDefinitionId_itemName_key";

-- DropIndex
DROP INDEX "CatalogueItemInputParameter_modelDefinitionId_inputName_key";

-- AlterTable
ALTER TABLE "CatalogueItemBomItem" DROP COLUMN "modelDefinitionId",
ADD COLUMN     "catalogueItemDefinitionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CatalogueItemInputParameter" DROP COLUMN "modelDefinitionId",
ADD COLUMN     "catalogueItemDefinitionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "GeneratedPlankList" DROP COLUMN "projectModelInstanceId",
ADD COLUMN     "projectCatalogueItemInstanceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProjectCatalogueItemInstance" DROP COLUMN "modelDefinitionId",
ADD COLUMN     "catalogueItemDefinitionId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CatalogueItemBomItem_catalogueItemDefinitionId_itemName_key" ON "CatalogueItemBomItem"("catalogueItemDefinitionId", "itemName");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogueItemInputParameter_catalogueItemDefinitionId_input_key" ON "CatalogueItemInputParameter"("catalogueItemDefinitionId", "inputName");

-- AddForeignKey
ALTER TABLE "CatalogueItemInputParameter" ADD CONSTRAINT "CatalogueItemInputParameter_catalogueItemDefinitionId_fkey" FOREIGN KEY ("catalogueItemDefinitionId") REFERENCES "CatalogueItemDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogueItemBomItem" ADD CONSTRAINT "CatalogueItemBomItem_catalogueItemDefinitionId_fkey" FOREIGN KEY ("catalogueItemDefinitionId") REFERENCES "CatalogueItemDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCatalogueItemInstance" ADD CONSTRAINT "ProjectCatalogueItemInstance_catalogueItemDefinitionId_fkey" FOREIGN KEY ("catalogueItemDefinitionId") REFERENCES "CatalogueItemDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedPlankList" ADD CONSTRAINT "GeneratedPlankList_projectCatalogueItemInstanceId_fkey" FOREIGN KEY ("projectCatalogueItemInstanceId") REFERENCES "ProjectCatalogueItemInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
