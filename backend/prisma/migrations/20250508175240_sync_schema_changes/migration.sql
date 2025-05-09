-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "generatedPlankListFileId" INTEGER;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "actionRequired" TEXT,
ALTER COLUMN "statusId" SET DEFAULT 1;

-- CreateTable
CREATE TABLE "Material" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "materialId" TEXT NOT NULL,
    "plyThickness" DOUBLE PRECISION NOT NULL,
    "innerLaminateCode" TEXT NOT NULL,
    "outerLaminateCode" TEXT NOT NULL,
    "overallThickness" DOUBLE PRECISION NOT NULL,
    "plyType" TEXT NOT NULL,
    "grainDirection" TEXT,
    "edgebandingInnerCode" TEXT NOT NULL,
    "edgebandingExposedCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteVisitBox" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "modelType" TEXT NOT NULL,
    "inputs" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteVisitBox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Material_projectId_materialId_key" ON "Material"("projectId", "materialId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_generatedPlankListFileId_fkey" FOREIGN KEY ("generatedPlankListFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVisitBox" ADD CONSTRAINT "SiteVisitBox_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
