import { PrismaClient } from '@prisma/client';
import { INTERNAL_ROLES, EXTERNAL_ROLES } from '../constants/roles';

const prisma = new PrismaClient();

// Define base permissions for different role types
const basePermissions: Record<string, string[]> = {
  PROJECT_MANAGER: [
    'project.create',
    'project.update',
    'project.view',
    'project.assign',
    'task.create',
    'task.update',
    'task.view',
    'task.assign',
    'document.generate',
    'document.view'
  ],
  DESIGNER: [
    'project.view',
    'project.comment',
    'document.view'
  ],
  HOME_OWNER: [
    'project.view',
    'project.comment'
  ],
  // Add specific permissions for other roles
  BIM_ENGINEER: [
    'project.view',
    'task.update',
    'model.create',
    'model.edit',
    'plank.generate'
  ],
  INPUT_QA: [
    'project.view',
    'task.update',
    'document.generate'
  ],
  OUTPUT_QA: [
    'project.view',
    'task.update',
    'document.generate'
  ],
  SITE_ENGINEER: [
    'project.view',
    'task.update',
    'site.visit',
    'document.view'
  ]
};

async function seedRolesAndPermissions() {
  try {
    console.log('Starting role and permission seeding...');

    // Create all unique permissions
    const allPermissions = new Set<string>();
    Object.values(basePermissions).forEach(perms => {
      perms.forEach(perm => allPermissions.add(perm));
    });

    // Create permissions in database
    for (const permission of allPermissions) {
      await prisma.userPermission.upsert({
        where: { permission },
        update: {},
        create: { permission }
      });
      console.log(`Created/Updated permission: ${permission}`);
    }

    // Create internal roles
    for (const [roleKey, roleName] of Object.entries(INTERNAL_ROLES)) {
      // Find existing role or create new one
      let role = await prisma.userRole.findFirst({
        where: { role: roleName }
      });

      if (!role) {
        role = await prisma.userRole.create({
          data: { role: roleName, roleType: 'INTERNAL' }
        });
      } else {
        role = await prisma.userRole.update({
          where: { id: role.id },
          data: { roleType: 'INTERNAL' }
        });
      }

      // Assign base permissions if they exist for this role
      const rolePermissions = basePermissions[roleKey as keyof typeof basePermissions] || [];
      if (rolePermissions.length > 0) {
        // Get permission IDs
        const permissions = await prisma.userPermission.findMany({
          where: { permission: { in: rolePermissions } }
        });

        // Create role-permission mappings
        for (const permission of permissions) {
          // Check if mapping already exists
          const existingMapping = await prisma.rolePermissionMapping.findFirst({
            where: {
              roleId: role.id,
              permissionId: permission.id
            }
          });

          if (!existingMapping) {
            await prisma.rolePermissionMapping.create({
              data: {
                roleId: role.id,
                permissionId: permission.id
              }
            });
          }
        }
      }
      console.log(`Created/Updated internal role: ${roleName}`);
    }

    // Create external roles
    for (const [roleKey, roleName] of Object.entries(EXTERNAL_ROLES)) {
      // Find existing role or create new one
      let role = await prisma.userRole.findFirst({
        where: { role: roleName }
      });

      if (!role) {
        role = await prisma.userRole.create({
          data: { role: roleName, roleType: 'EXTERNAL' }
        });
      } else {
        role = await prisma.userRole.update({
          where: { id: role.id },
          data: { roleType: 'EXTERNAL' }
        });
      }

      // Assign base permissions if they exist for this role
      const rolePermissions = basePermissions[roleKey as keyof typeof basePermissions] || [];
      if (rolePermissions.length > 0) {
        // Get permission IDs
        const permissions = await prisma.userPermission.findMany({
          where: { permission: { in: rolePermissions } }
        });

        // Create role-permission mappings
        for (const permission of permissions) {
          // Check if mapping already exists
          const existingMapping = await prisma.rolePermissionMapping.findFirst({
            where: {
              roleId: role.id,
              permissionId: permission.id
            }
          });

          if (!existingMapping) {
            await prisma.rolePermissionMapping.create({
              data: {
                roleId: role.id,
                permissionId: permission.id
              }
            });
          }
        }
      }
      console.log(`Created/Updated external role: ${roleName}`);
    }

    console.log('Role and permission seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding roles and permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if this script is run directly
if (require.main === module) {
  seedRolesAndPermissions()
    .catch(error => {
      console.error('Error running seed script:', error);
      process.exit(1);
    });
}

export { seedRolesAndPermissions };
