import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Define roles
    const roles = [
      { id: 1, role: 'super admin', roleType: 'admin' },
      { id: 2, role: 'admin', roleType: 'admin' },
      { id: 3, role: 'engineer', roleType: 'user' },
      { id: 4, role: 'client', roleType: 'user' },
    ];

    // Define permissions
    const permissions = [
      { id: 1, permission: 'create_user' },
      { id: 2, permission: 'change_user_role' },
      { id: 3, permission: 'create_project' },
      { id: 4, permission: 'modify_project' },
      { id: 5, permission: 'upload_file' },
      { id: 6, permission: 'download_file' },
      { id: 7, permission: 'view_file' },
    ];

    // Define role-permission mappings
    const rolePermissionMappings = [
      // Super Admin and Admin
      { roleId: 1, permissionId: 1 },
      { roleId: 1, permissionId: 2 },
      { roleId: 1, permissionId: 3 },
      { roleId: 1, permissionId: 4 },
      { roleId: 1, permissionId: 5 },
      { roleId: 1, permissionId: 6 },
      { roleId: 1, permissionId: 7 },
      { roleId: 2, permissionId: 1 },
      { roleId: 2, permissionId: 2 },
      { roleId: 2, permissionId: 3 },
      { roleId: 2, permissionId: 4 },
      { roleId: 2, permissionId: 5 },
      { roleId: 2, permissionId: 6 },
      { roleId: 2, permissionId: 7 },
      // Engineer
      { roleId: 3, permissionId: 3 },
      { roleId: 3, permissionId: 4 },
      { roleId: 3, permissionId: 5 },
      { roleId: 3, permissionId: 6 },
      // Client
      { roleId: 4, permissionId: 6 },
      { roleId: 4, permissionId: 7 },
    ];

    // Upsert roles
    for (const role of roles) {
      await prisma.userRole.upsert({
        where: { id: role.id },
        update: {},
        create: role,
      });
    }

    // Upsert permissions
    for (const permission of permissions) {
      await prisma.userPermission.upsert({
        where: { id: permission.id },
        update: {},
        create: permission,
      });
    }

    // Upsert role-permission mappings
    for (const mapping of rolePermissionMappings) {
      await prisma.rolePermissionMapping.upsert({
        where: { id: mapping.roleId * 10 + mapping.permissionId }, // Unique composite key
        update: {},
        create: mapping,
      });
    }

    console.log('Roles and permissions populated successfully.');
  } catch (error) {
    console.error('Error populating roles and permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
