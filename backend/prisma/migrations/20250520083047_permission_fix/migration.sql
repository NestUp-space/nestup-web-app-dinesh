/*
  Warnings:

  - A unique constraint covering the columns `[roleId,permissionId]` on the table `RolePermissionMapping` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[permission]` on the table `UserPermission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[role]` on the table `UserRole` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RolePermissionMapping_roleId_permissionId_key" ON "RolePermissionMapping"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_permission_key" ON "UserPermission"("permission");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_role_key" ON "UserRole"("role");
