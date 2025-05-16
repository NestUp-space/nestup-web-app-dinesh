-- Fix the conflicting status field in Project table
ALTER TABLE "Project" DROP COLUMN status;
ALTER TABLE "Project" ADD COLUMN "projectStatus" VARCHAR(255) DEFAULT 'DRAFT';
