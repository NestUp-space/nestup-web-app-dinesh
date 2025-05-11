-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('INPUT_QA_CSV', 'PRESSING_LIST_CSV', 'OUTPUT_QA_CSV', 'CUTLIST_PDF', 'PLANKLABEL_PDF', 'INSTALLATION_GUIDE_PDF', 'PROFORMA_INVOICE_PDF', 'FINAL_INVOICE_PDF', 'PROJECT_PLANK_LIST_CSV');

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "projectId" INTEGER,
    "projectModelInstanceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_projectModelInstanceId_fkey" FOREIGN KEY ("projectModelInstanceId") REFERENCES "ProjectModelInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
