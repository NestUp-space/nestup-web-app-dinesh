-- roleType column has been added directly to the database
-- This section is intentionally left empty to avoid conflicts with the shadow database

-- Add enum type for role type if it doesn't exist
-- DO $$ BEGIN
--     CREATE TYPE "RoleType" AS ENUM ('INTERNAL', 'EXTERNAL');
-- EXCEPTION
--     WHEN duplicate_object THEN null;
-- END $$;

-- Update the Project table
-- First, rename clientId to designerId and update the relations
ALTER TABLE "Project" RENAME COLUMN "clientId" TO "designerId";
ALTER TABLE "ClientProjectMapping" RENAME TO "DesignerProjectMapping";
ALTER TABLE "DesignerProjectMapping" RENAME COLUMN "clientId" TO "designerId";

-- Add projectManagerId column
ALTER TABLE "Project" 
ADD COLUMN IF NOT EXISTS "projectManagerId" INTEGER,
ADD CONSTRAINT "Project_projectManagerId_fkey" 
FOREIGN KEY ("projectManagerId") REFERENCES "User"("id");

-- Add new relations for Project
ALTER TABLE "Project" 
ADD CONSTRAINT "Project_designerId_fkey" 
FOREIGN KEY ("designerId") REFERENCES "User"("id");

-- The relation from Project.projectManagerId to User.id is handled by Prisma schema.
-- Removing explicit ALTER TABLE "User" for this relation as it was causing issues.
-- -- Add new relation to User model for project management
-- ALTER TABLE "User"
-- ADD CONSTRAINT "User_ProjectManager" 
-- FOREIGN KEY ("id") REFERENCES "Project"("projectManagerId") ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_project_designer" ON "Project"("designerId");
CREATE INDEX IF NOT EXISTS "idx_project_project_manager" ON "Project"("projectManagerId");
-- Index for roleType has been created directly in the database

-- Update of roles and roleType values has been handled directly in the database
