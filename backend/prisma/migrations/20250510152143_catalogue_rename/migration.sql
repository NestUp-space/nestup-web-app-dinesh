/*
  Warnings:

  - You are about to drop the `BillOfMaterialItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ModelDefinition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ModelInputParameter` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectModelInstance` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BillOfMaterialItem" DROP CONSTRAINT "BillOfMaterialItem_modelDefinitionId_fkey";

-- DropForeignKey
ALTER TABLE "GeneratedPlankList" DROP CONSTRAINT "GeneratedPlankList_projectModelInstanceId_fkey";

-- DropForeignKey
ALTER TABLE "ModelInputParameter" DROP CONSTRAINT "ModelInputParameter_modelDefinitionId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectModelInstance" DROP CONSTRAINT "ProjectModelInstance_modelDefinitionId_fkey";

-- DropTable
DROP TABLE "BillOfMaterialItem";

-- DropTable
DROP TABLE "ModelDefinition";

-- DropTable
DROP TABLE "ModelInputParameter";

-- DropTable
DROP TABLE "ProjectModelInstance";

-- CreateTable
CREATE TABLE "CatalogueItemDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sampleRuntimeInputsJson" JSONB,
    "expectedOutputSchemaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogueItemDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogueItemInputParameter" (
    "id" TEXT NOT NULL,
    "modelDefinitionId" TEXT NOT NULL,
    "inputName" TEXT NOT NULL,
    "displayLabel" TEXT,
    "inputType" TEXT NOT NULL,
    "defaultValue" TEXT,
    "options" JSONB,
    "unit" TEXT,
    "description" TEXT,

    CONSTRAINT "CatalogueItemInputParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogueItemBomItem" (
    "id" TEXT NOT NULL,
    "modelDefinitionId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemType" "BomItemType" NOT NULL,
    "itemDescription" TEXT,
    "itemLogicScript" TEXT,
    "addonModelId" TEXT,

    CONSTRAINT "CatalogueItemBomItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectCatalogueItemInstance" (
    "id" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "modelDefinitionId" TEXT NOT NULL,
    "runtimeInputsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectCatalogueItemInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogueItemDefinition_name_key" ON "CatalogueItemDefinition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogueItemInputParameter_modelDefinitionId_inputName_key" ON "CatalogueItemInputParameter"("modelDefinitionId", "inputName");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogueItemBomItem_modelDefinitionId_itemName_key" ON "CatalogueItemBomItem"("modelDefinitionId", "itemName");

-- AddForeignKey
ALTER TABLE "CatalogueItemInputParameter" ADD CONSTRAINT "CatalogueItemInputParameter_modelDefinitionId_fkey" FOREIGN KEY ("modelDefinitionId") REFERENCES "CatalogueItemDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogueItemBomItem" ADD CONSTRAINT "CatalogueItemBomItem_modelDefinitionId_fkey" FOREIGN KEY ("modelDefinitionId") REFERENCES "CatalogueItemDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCatalogueItemInstance" ADD CONSTRAINT "ProjectCatalogueItemInstance_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCatalogueItemInstance" ADD CONSTRAINT "ProjectCatalogueItemInstance_modelDefinitionId_fkey" FOREIGN KEY ("modelDefinitionId") REFERENCES "CatalogueItemDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedPlankList" ADD CONSTRAINT "GeneratedPlankList_projectModelInstanceId_fkey" FOREIGN KEY ("projectModelInstanceId") REFERENCES "ProjectCatalogueItemInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
