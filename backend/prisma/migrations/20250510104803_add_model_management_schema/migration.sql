-- CreateEnum
CREATE TYPE "BomItemType" AS ENUM ('PLANK', 'HARDWARE', 'ADDON');

-- CreateTable
CREATE TABLE "ModelDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelInputParameter" (
    "id" TEXT NOT NULL,
    "modelDefinitionId" TEXT NOT NULL,
    "inputName" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "defaultValue" TEXT,
    "options" JSONB,
    "unit" TEXT,
    "description" TEXT,

    CONSTRAINT "ModelInputParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillOfMaterialItem" (
    "id" TEXT NOT NULL,
    "modelDefinitionId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemType" "BomItemType" NOT NULL,
    "itemDescription" TEXT,
    "rulesJson" JSONB NOT NULL,
    "addonModelId" TEXT,

    CONSTRAINT "BillOfMaterialItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectModelInstance" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "modelDefinitionId" TEXT NOT NULL,
    "runtimeInputsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectModelInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedPlankList" (
    "id" TEXT NOT NULL,
    "projectModelInstanceId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filePath" TEXT,
    "csvContent" TEXT,

    CONSTRAINT "GeneratedPlankList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModelDefinition_name_key" ON "ModelDefinition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ModelInputParameter_modelDefinitionId_inputName_key" ON "ModelInputParameter"("modelDefinitionId", "inputName");

-- CreateIndex
CREATE UNIQUE INDEX "BillOfMaterialItem_modelDefinitionId_itemName_key" ON "BillOfMaterialItem"("modelDefinitionId", "itemName");

-- AddForeignKey
ALTER TABLE "ModelInputParameter" ADD CONSTRAINT "ModelInputParameter_modelDefinitionId_fkey" FOREIGN KEY ("modelDefinitionId") REFERENCES "ModelDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillOfMaterialItem" ADD CONSTRAINT "BillOfMaterialItem_modelDefinitionId_fkey" FOREIGN KEY ("modelDefinitionId") REFERENCES "ModelDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectModelInstance" ADD CONSTRAINT "ProjectModelInstance_modelDefinitionId_fkey" FOREIGN KEY ("modelDefinitionId") REFERENCES "ModelDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedPlankList" ADD CONSTRAINT "GeneratedPlankList_projectModelInstanceId_fkey" FOREIGN KEY ("projectModelInstanceId") REFERENCES "ProjectModelInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
