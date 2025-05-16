import { PrismaClient } from '@prisma/client';
import { PERMISSIONS, getAllPermissions } from '../constants/permissions';
import { expandPermission } from '../types/permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting permission system migration...');

  try {
    // 1. Create all permissions
    const allPermissions = getAllPermissions();
    console.log(`Found ${allPermissions.length} permissions to create...`);

    // Create permissions in bulk
    await prisma.userPermission.createMany({
      data: allPermissions.map(permissionString => ({
        permission: permissionString
      })),
      skipDuplicates: true // Skip if permission already exists
    });
    console.log('All permissions created successfully.');

    // 2. Create default roles with appropriate permissions
    // Super Admin Role - gets all permissions
    const superAdminRole = await prisma.userRole.upsert({
      where: { id: 1 },
      update: {
        role: 'Super Admin',
        roleType: 'superadmin'
      },
      create: {
        id: 1,
        role: 'Super Admin',
        roleType: 'superadmin'
      }
    });

    // Admin Role - gets all permissions except critical system ones
    const adminRole = await prisma.userRole.upsert({
      where: { id: 2 },
      update: {
        role: 'Admin',
        roleType: 'admin'
      },
      create: {
        id: 2,
        role: 'Admin',
        roleType: 'admin'
      }
    });

    // User Role - gets basic permissions
    const userRole = await prisma.userRole.upsert({
      where: { id: 3 },
      update: {
        role: 'User',
        roleType: 'user'
      },
      create: {
        id: 3,
        role: 'User',
        roleType: 'user'
      }
    });

    console.log('Default roles created successfully.');

    // 3. Set up role permissions
    // First, clear existing mappings
    await prisma.rolePermissionMapping.deleteMany({
      where: {
        roleId: {
          in: [superAdminRole.id, adminRole.id, userRole.id]
        }
      }
    });

    // Get all permissions with their IDs
    const permissionsMap = new Map(
      (await prisma.userPermission.findMany()).map(p => [p.permission, p.id])
    );

        // Super Admin gets ALL permissions with inheritance
    const superAdminPermissions = Array.from(new Set(
      allPermissions.flatMap(permission => {
        const expanded = Array.from(expandPermission(permission));
        return expanded.map(p => ({
          roleId: superAdminRole.id,
          permissionId: permissionsMap.get(p)!
        }));
      })
    ));

    // Admin gets most permissions (excluding system-critical ones) with inheritance
    const adminPermissions = Array.from(new Set(
      allPermissions
        .filter(permission => !permission.includes('system.'))
        .flatMap(permission => {
          const expanded = Array.from(expandPermission(permission));
          return expanded.map(p => ({
            roleId: adminRole.id,
            permissionId: permissionsMap.get(p)!
          }));
        })
    ));

    // User gets basic view permissions with inheritance
    const userBasePermissions = [
      PERMISSIONS.PROJECTS.VIEW,
      PERMISSIONS.MATERIALS.VIEW,
      PERMISSIONS.CATALOGUE.VIEW
    ];

    const userPermissions = Array.from(new Set(
      userBasePermissions.flatMap(permission => {
        const expanded = Array.from(expandPermission(permission));
        return expanded.map(p => ({
          roleId: userRole.id,
          permissionId: permissionsMap.get(p)!
        }));
      })
    ));

    // Create all role permission mappings
    await prisma.rolePermissionMapping.createMany({
      data: [
        ...superAdminPermissions,
        ...adminPermissions,
        ...userPermissions
      ],
      skipDuplicates: true
    });

    console.log('Role permissions assigned successfully.');

    // 4. Ensure any existing admin users have the correct role
    await prisma.user.updateMany({
      where: {
        role: {
          roleType: 'admin'
        }
      },
      data: {
        roleId: adminRole.id
      }
    });

    console.log('User roles updated successfully.');
    console.log('Permission system migration completed successfully!');

  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
