/*
  Warnings:

  - You are about to drop the column `projectCatalogueItemInstanceId` on the `GeneratedPlankList` table. All the data in the column will be lost.
  - You are about to drop the `CatalogueItemBomItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CatalogueItemDefinition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CatalogueItemInputParameter` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectCatalogueItemInstance` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `projectModelInstanceId` to the `GeneratedPlankList` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CatalogueItemBomItem" DROP CONSTRAINT "CatalogueItemBomItem_catalogueItemDefinitionId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogueItemInputParameter" DROP CONSTRAINT "CatalogueItemInputParameter_catalogueItemDefinitionId_fkey";

-- DropForeignKey
ALTER TABLE "GeneratedPlankList" DROP CONSTRAINT "GeneratedPlankList_projectCatalogueItemInstanceId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectCatalogueItemInstance" DROP CONSTRAINT "ProjectCatalogueItemInstance_catalogueItemDefinitionId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectCatalogueItemInstance" DROP CONSTRAINT "ProjectCatalogueItemInstance_projectId_fkey";

-- AlterTable
ALTER TABLE "GeneratedPlankList" DROP COLUMN "projectCatalogueItemInstanceId",
ADD COLUMN     "projectModelInstanceId" TEXT NOT NULL;

-- DropTable
DROP TABLE "CatalogueItemBomItem";

-- DropTable
DROP TABLE "CatalogueItemDefinition";

-- DropTable
DROP TABLE "CatalogueItemInputParameter";

-- DropTable
DROP TABLE "ProjectCatalogueItemInstance";

-- CreateTable
CREATE TABLE "ModelDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sampleRuntimeInputsJson" JSONB,
    "expectedOutputSchemaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelInputParameter" (
    "id" TEXT NOT NULL,
    "modelDefinitionId" TEXT NOT NULL,
    "inputName" TEXT NOT NULL,
    "displayLabel" TEXT,
    "inputType" TEXT NOT NULL,
    "defaultValue" TEXT,
    "options" JSONB,
    "unit" TEXT,
    "description" TEXT,

    CONSTRAINT "ModelInputParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelBomItem" (
    "id" TEXT NOT NULL,
    "modelDefinitionId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemType" "BomItemType" NOT NULL,
    "itemDescription" TEXT,
    "details" JSONB,
    "itemLogicScript" TEXT,
    "addonModelId" TEXT,

    CONSTRAINT "ModelBomItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectModelInstance" (
    "id" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "modelDefinitionId" TEXT NOT NULL,
    "runtimeInputsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectModelInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModelDefinition_name_key" ON "ModelDefinition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ModelInputParameter_modelDefinitionId_inputName_key" ON "ModelInputParameter"("modelDefinitionId", "inputName");

-- CreateIndex
CREATE UNIQUE INDEX "ModelBomItem_modelDefinitionId_itemName_key" ON "ModelBomItem"("modelDefinitionId", "itemName");

-- AddForeignKey
ALTER TABLE "ModelInputParameter" ADD CONSTRAINT "ModelInputParameter_modelDefinitionId_fkey" FOREIGN KEY ("modelDefinitionId") REFERENCES "ModelDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelBomItem" ADD CONSTRAINT "ModelBomItem_modelDefinitionId_fkey" FOREIGN KEY ("modelDefinitionId") REFERENCES "ModelDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectModelInstance" ADD CONSTRAINT "ProjectModelInstance_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectModelInstance" ADD CONSTRAINT "ProjectModelInstance_modelDefinitionId_fkey" FOREIGN KEY ("modelDefinitionId") REFERENCES "ModelDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedPlankList" ADD CONSTRAINT "GeneratedPlankList_projectModelInstanceId_fkey" FOREIGN KEY ("projectModelInstanceId") REFERENCES "ProjectModelInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
