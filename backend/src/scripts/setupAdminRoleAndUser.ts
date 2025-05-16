import { PrismaClient } from '@prisma/client';
import { getAllPermissions } from '../constants/permissions'; // Corrected import path
import bcrypt from 'bcryptjs'; // For password hashing

const prisma = new PrismaClient();

async function main() {
  console.log('Starting admin role and user setup script...');

  // 1. Get all possible permission strings from the centralized function
  const finalPermissionStrings = getAllPermissions();

  console.log(`Found ${finalPermissionStrings.length} unique permission strings from constants.`);

  // 2. Ensure all these permissions exist in UserPermission table
  const existingPermissions = await prisma.userPermission.findMany({
    where: {
      permission: {
        in: finalPermissionStrings,
      },
    },
    select: { permission: true },
  });
  const existingPermissionSet = new Set(existingPermissions.map(p => p.permission));
  
  const newPermissionsToCreate = finalPermissionStrings.filter(
    (pName: string) => !existingPermissionSet.has(pName)
  );

  if (newPermissionsToCreate.length > 0) {
    await prisma.userPermission.createMany({
      data: newPermissionsToCreate.map((pName: string) => ({ permission: pName })),
      skipDuplicates: true, // Should not be needed if logic is correct, but good safeguard
    });
    console.log(`${newPermissionsToCreate.length} new permissions created in UserPermission table.`);
  } else {
    console.log('All permissions already exist in UserPermission table.');
  }
  
  console.log('All required permissions ensured in UserPermission table.');

  // 3. Upsert the "admin" role (roleId = 1)
  const adminRoleName = 'admin';
  const adminRoleType = 'admin'; // As per request "ADMIN" role
  const adminRoleId = 1;

  const adminRole = await prisma.userRole.upsert({
    where: { id: adminRoleId },
    update: {
      role: adminRoleName,
      roleType: adminRoleType,
    },
    create: {
      id: adminRoleId, // Explicitly set ID if it's not autoincrement or if we want to ensure it's 1
      role: adminRoleName,
      roleType: adminRoleType,
    },
  });
  console.log(`Admin role (ID: ${adminRole.id}) upserted as: ${adminRole.role} (${adminRole.roleType})`);

  // 4. Grant all permissions to the "admin" role
  // First, clear existing permissions for this role to ensure a clean slate
  await prisma.rolePermissionMapping.deleteMany({
    where: { roleId: adminRole.id },
  });
  console.log(`Cleared existing permissions for role ID: ${adminRole.id}`);

  // Fetch all permission IDs
  const allPermissionsFromDb = await prisma.userPermission.findMany({
    where: {
      permission: {
        in: finalPermissionStrings,
      },
    },
    select: { id: true },
  });

  const rolePermissionMappings = allPermissionsFromDb.map(p => ({
    roleId: adminRole.id,
    permissionId: p.id,
  }));

  await prisma.rolePermissionMapping.createMany({
    data: rolePermissionMappings,
  });
  console.log(`Granted all ${allPermissionsFromDb.length} permissions to admin role (ID: ${adminRole.id}).`);

  // 5. Find and assign the user "admin@nestup.com" to this admin role
  const adminUserEmail = 'admin@nestup.com';
  const adminUserName = 'Admin User'; // As per request

  const userToUpdate = await prisma.user.findUnique({
    where: { email: adminUserEmail },
  });

  if (userToUpdate) {
    await prisma.user.update({
      where: { email: adminUserEmail },
      data: {
        roleId: adminRole.id,
        name: adminUserName, // Also update name if specified
      },
    });
    console.log(`User ${adminUserEmail} found and updated to roleId ${adminRole.id} and name "${adminUserName}".`);
  } else {
    // If user doesn't exist, create them.
    // For security, it's better to prompt for a password or use a secure, temporary one.
    // If user doesn't exist, create them.
    console.log(`User ${adminUserEmail} not found. Creating user...`);
    const tempPassword = 'Password123!'; // Placeholder password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Generate a unique phone number placeholder to avoid unique constraint errors if script is run multiple times
    // or if other users have '0000000000'
    const uniquePhoneNumberPlaceholder = `0000000000_${Date.now()}`;

    await prisma.user.create({
      data: {
        email: adminUserEmail,
        name: adminUserName,
        password: hashedPassword,
        phoneNumber: uniquePhoneNumberPlaceholder, // Placeholder, ensure it's unique if script is rerun
        roleId: adminRole.id,
        verified: true, // Assuming admin user is verified by default
        isActive: true,
      }
    });
    console.log(`User ${adminUserEmail} created with roleId ${adminRole.id}. NAME: ${adminUserName}. IMPORTANT: PLEASE CHANGE THE DEFAULT PASSWORD ('${tempPassword}') IMMEDIATELY.`);
  }

  console.log('Admin role and user setup script finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
