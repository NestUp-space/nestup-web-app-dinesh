-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CRM_SYNCED', 'CALENDAR_CREATED', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "LidarSessionStatus" AS ENUM ('CREATED', 'UPLOADING', 'PROCESSING', 'PROCESSED', 'DESIGNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ScanFormat" AS ENUM ('CSV_2D', 'PLY_3D', 'PCD_3D', 'NPY_3D');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'UPLOADING', 'UPLOADED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "FeatureType" AS ENUM ('WINDOW', 'DOOR', 'PROTRUSION', 'RECESS', 'COLUMN', 'SWITCHBOARD', 'OTHER');

-- CreateEnum
CREATE TYPE "ModuleCategory" AS ENUM ('STORAGE', 'KITCHEN', 'WARDROBE', 'BATHROOM', 'LIVING', 'OFFICE', 'CUSTOM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentType" ADD VALUE 'LIDAR_FLOOR_PLAN_PDF';
ALTER TYPE "DocumentType" ADD VALUE 'LIDAR_BOM_CSV';
ALTER TYPE "DocumentType" ADD VALUE 'LIDAR_DIMENSION_REPORT_PDF';

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" JSONB NOT NULL,
    "preferredDateTime" TIMESTAMP(3) NOT NULL,
    "alternateDateTime" TIMESTAMP(3),
    "projectType" TEXT,
    "requirements" TEXT,
    "source" TEXT NOT NULL DEFAULT 'website',
    "utmParams" JSONB,
    "crmLeadId" TEXT,
    "calendarEventId" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LidarSession" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER,
    "name" TEXT,
    "status" "LidarSessionStatus" NOT NULL DEFAULT 'CREATED',
    "deviceId" TEXT,
    "location" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LidarSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LidarScanData" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileSize" BIGINT,
    "pointCount" INTEGER,
    "scanFormat" "ScanFormat" NOT NULL DEFAULT 'CSV_2D',
    "uploadStatus" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "chunksReceived" INTEGER NOT NULL DEFAULT 0,
    "totalChunks" INTEGER,
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LidarScanData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LidarProcessedData" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "floorPlanJson" JSONB,
    "roomDimensions" JSONB,
    "wallCount" INTEGER,
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "processingTimeMs" INTEGER,
    "errorMessage" TEXT,
    "processedFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LidarProcessedData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LidarWall" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "wallIndex" INTEGER NOT NULL,
    "startPoint" JSONB NOT NULL,
    "endPoint" JSONB NOT NULL,
    "length" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION,
    "normalVector" JSONB,
    "boundaryPoints" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LidarWall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LidarFeature" (
    "id" TEXT NOT NULL,
    "wallId" TEXT,
    "sessionId" TEXT NOT NULL,
    "featureType" "FeatureType" NOT NULL,
    "position" JSONB NOT NULL,
    "dimensions" JSONB NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LidarFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LidarModuleTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ModuleCategory" NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "modelUrl" TEXT,
    "defaultDimensions" JSONB NOT NULL,
    "constraints" JSONB NOT NULL,
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "placementRules" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LidarModuleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LidarPlacedModule" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "wallId" TEXT,
    "position" JSONB NOT NULL,
    "dimensions" JSONB NOT NULL,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LidarPlacedModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LidarSessionBom" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "materials" JSONB NOT NULL,
    "cutList" JSONB NOT NULL,
    "hardware" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LidarSessionBom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Booking_email_idx" ON "Booking"("email");

-- CreateIndex
CREATE INDEX "Booking_phone_idx" ON "Booking"("phone");

-- CreateIndex
CREATE INDEX "Booking_preferredDateTime_idx" ON "Booking"("preferredDateTime");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "LidarSession_userId_idx" ON "LidarSession"("userId");

-- CreateIndex
CREATE INDEX "LidarSession_status_idx" ON "LidarSession"("status");

-- CreateIndex
CREATE INDEX "LidarSession_createdAt_idx" ON "LidarSession"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LidarScanData_sessionId_key" ON "LidarScanData"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "LidarProcessedData_sessionId_key" ON "LidarProcessedData"("sessionId");

-- CreateIndex
CREATE INDEX "LidarWall_sessionId_idx" ON "LidarWall"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "LidarWall_sessionId_wallIndex_key" ON "LidarWall"("sessionId", "wallIndex");

-- CreateIndex
CREATE INDEX "LidarFeature_sessionId_idx" ON "LidarFeature"("sessionId");

-- CreateIndex
CREATE INDEX "LidarFeature_wallId_idx" ON "LidarFeature"("wallId");

-- CreateIndex
CREATE UNIQUE INDEX "LidarModuleTemplate_name_key" ON "LidarModuleTemplate"("name");

-- CreateIndex
CREATE INDEX "LidarPlacedModule_sessionId_idx" ON "LidarPlacedModule"("sessionId");

-- CreateIndex
CREATE INDEX "LidarPlacedModule_templateId_idx" ON "LidarPlacedModule"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "LidarSessionBom_sessionId_key" ON "LidarSessionBom"("sessionId");

-- AddForeignKey
ALTER TABLE "LidarSession" ADD CONSTRAINT "LidarSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LidarScanData" ADD CONSTRAINT "LidarScanData_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LidarSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LidarProcessedData" ADD CONSTRAINT "LidarProcessedData_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LidarSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LidarWall" ADD CONSTRAINT "LidarWall_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LidarSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LidarFeature" ADD CONSTRAINT "LidarFeature_wallId_fkey" FOREIGN KEY ("wallId") REFERENCES "LidarWall"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LidarFeature" ADD CONSTRAINT "LidarFeature_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LidarSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LidarPlacedModule" ADD CONSTRAINT "LidarPlacedModule_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LidarSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LidarPlacedModule" ADD CONSTRAINT "LidarPlacedModule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LidarModuleTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LidarPlacedModule" ADD CONSTRAINT "LidarPlacedModule_wallId_fkey" FOREIGN KEY ("wallId") REFERENCES "LidarWall"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LidarSessionBom" ADD CONSTRAINT "LidarSessionBom_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LidarSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
