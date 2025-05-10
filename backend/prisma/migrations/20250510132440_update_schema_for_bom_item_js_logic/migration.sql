/*
  Warnings:

  - You are about to drop the column `rulesJson` on the `BillOfMaterialItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BillOfMaterialItem" DROP COLUMN "rulesJson",
ADD COLUMN     "itemLogicScript" TEXT;

-- AlterTable
ALTER TABLE "ModelDefinition" ADD COLUMN     "expectedOutputSchemaJson" JSONB,
ADD COLUMN     "sampleRuntimeInputsJson" JSONB;
