-- Add unique constraint to permission field in UserPermission table
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permission_key" UNIQUE ("permission");
