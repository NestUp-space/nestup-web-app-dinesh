-- Modify the UserRole table to add role type enumeration
ALTER TABLE "UserRole" ADD COLUMN IF NOT EXISTS "roleType" VARCHAR(255) DEFAULT 'INTERNAL' NOT NULL;

-- Add enum type for role type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "RoleType" AS ENUM ('INTERNAL', 'EXTERNAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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
CREATE INDEX IF NOT EXISTS "idx_user_role_type" ON "UserRole"("roleType");

-- Update existing client relations to designer
UPDATE "UserRole" 
SET role = 'Designer', roleType = 'EXTERNAL' 
WHERE role = 'client';

-- Add new roles
INSERT INTO "UserRole" (role, roleType) 
VALUES 
  ('Project Manager', 'INTERNAL'),
  ('Customer Acquisition', 'INTERNAL'),
  ('Site Engineer', 'INTERNAL'),
  ('BIM Engineer', 'INTERNAL'),
  ('Input QA', 'INTERNAL'),
  ('Pressing', 'INTERNAL'),
  ('Cutting', 'INTERNAL'),
  ('Output QA', 'INTERNAL'),
  ('Packing', 'INTERNAL'),
  ('Installation', 'INTERNAL'),
  ('Home Owner', 'EXTERNAL')
ON CONFLICT (role) DO UPDATE 
SET roleType = EXCLUDED.roleType;
