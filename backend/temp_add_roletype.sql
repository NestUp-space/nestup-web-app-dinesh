-- Attempt to drop a potentially problematic lowercase column first
ALTER TABLE "UserRole" DROP COLUMN IF EXISTS roletype;

-- Add the roleType column
ALTER TABLE "UserRole" ADD COLUMN IF NOT EXISTS "roleType" VARCHAR(255) DEFAULT 'INTERNAL' NOT NULL;

-- Create index for roleType
CREATE INDEX IF NOT EXISTS "idx_user_role_type" ON "UserRole"("roleType");

-- Update existing client relations to designer, including roleType
UPDATE "UserRole" 
SET role = 'Designer', "roleType" = 'EXTERNAL'
WHERE role = 'client';

-- Add new roles, including roleType (without ON CONFLICT)
-- First, check if each role exists before inserting
DO $$
DECLARE
  roles_to_add TEXT[] := ARRAY[
    'Project Manager', 'Customer Acquisition', 'Site Engineer', 'BIM Engineer',
    'Input QA', 'Pressing', 'Cutting', 'Output QA', 'Packing', 'Installation', 'Home Owner'
  ];
  role_types TEXT[] := ARRAY[
    'INTERNAL', 'INTERNAL', 'INTERNAL', 'INTERNAL',
    'INTERNAL', 'INTERNAL', 'INTERNAL', 'INTERNAL', 'INTERNAL', 'INTERNAL', 'EXTERNAL'
  ];
  i INTEGER;
  role_exists BOOLEAN;
BEGIN
  FOR i IN 1..array_length(roles_to_add, 1) LOOP
    -- Check if role exists
    SELECT EXISTS(SELECT 1 FROM "UserRole" WHERE role = roles_to_add[i]) INTO role_exists;
    
    -- If role doesn't exist, insert it
    IF NOT role_exists THEN
      INSERT INTO "UserRole" (role, "roleType") VALUES (roles_to_add[i], role_types[i]);
    ELSE
      -- If role exists, update its roleType
      UPDATE "UserRole" SET "roleType" = role_types[i] WHERE role = roles_to_add[i];
    END IF;
  END LOOP;
END $$;
