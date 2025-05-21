import { PrismaClient, BomItemType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getAllPermissions as getAllPermissionStrings, PERMISSIONS } from '../src/constants/permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // --- Seed Permissions ---
  const allPermissionNames = getAllPermissionStrings();
  console.log(`Found ${allPermissionNames.length} permissions to seed.`);
  for (const permName of allPermissionNames) {
    await prisma.userPermission.upsert({
      where: { permission: permName },
      update: {},
      create: { permission: permName },
    });
  }
  console.log('Permissions seeded/ensured.');
  const allPermissionsInDb = await prisma.userPermission.findMany();

  // --- Seed Admin UserRole ---
  const adminRoleName = 'admin';
  const adminRoleType = 'admin'; // Special type for admin
  const adminRole = await prisma.userRole.upsert({
    where: { role: adminRoleName },
    update: { roleType: adminRoleType },
    create: {
      role: adminRoleName,
      roleType: adminRoleType,
    },
  });
  console.log(`UserRole '${adminRole.role}' (ID: ${adminRole.id}) ensured with roleType '${adminRole.roleType}'.`);

  // --- Map all permissions to Admin Role ---
  if (adminRole && allPermissionsInDb.length > 0) {
    console.log(`Mapping ${allPermissionsInDb.length} permissions to role '${adminRole.role}' (ID: ${adminRole.id}).`);
    for (const perm of allPermissionsInDb) {
      await prisma.rolePermissionMapping.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      });
    }
    console.log(`All permissions mapped to '${adminRole.role}'.`);
  }

  // --- Seed Admin User ---
  const adminUserEmail = 'admin@nestup.com'; // Ensure this matches your intended admin email
  const adminUserName = 'Admin User';
  const adminUserPassword = 'DefaultAdminPassword123!'; // CHANGE THIS IN PRODUCTION
  const adminUserPhoneNumber = '0000000000_seed'; // Placeholder
  const hashedAdminPassword = await bcrypt.hash(adminUserPassword, 10);

  let dbAdminUser = await prisma.user.findUnique({
    where: { email: adminUserEmail },
  });

  if (!dbAdminUser) {
    if (!adminRole) {
      console.error("Admin role not found, cannot create admin user without it.");
    } else {
      dbAdminUser = await prisma.user.create({
        data: {
          email: adminUserEmail,
          name: adminUserName,
          password: hashedAdminPassword,
          phoneNumber: adminUserPhoneNumber,
          roleId: adminRole.id,
          verified: true,
          isActive: true,
        },
      });
      console.log(`Admin user '${adminUserEmail}' created with role '${adminRole.role}'. PLEASE CHANGE THE DEFAULT PASSWORD and PHONE NUMBER.`);
    }
  } else {
    const updates: any = {};
    if (adminRole && dbAdminUser.roleId !== adminRole.id) {
      updates.roleId = adminRole.id;
    }
    if (dbAdminUser.phoneNumber !== adminUserPhoneNumber) {
      updates.phoneNumber = adminUserPhoneNumber;
    }
    // Ensure admin user is active and verified
    if (!dbAdminUser.isActive) updates.isActive = true;
    if (!dbAdminUser.verified) updates.verified = true;

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { email: adminUserEmail },
        data: updates,
      });
      console.log(`Admin user '${adminUserEmail}' updated.`);
    } else {
      console.log(`Admin user '${adminUserEmail}' already exists and is configured.`);
    }
  }

  // --- Seed bimEngineer Role ---
  const bimEngineerRoleName = 'bimEngineer';
  const bimEngineerRoleType = 'INTERNAL';
  const bimEngineerRole = await prisma.userRole.upsert({
    where: { role: bimEngineerRoleName }, // Using new camelCase name
    update: { roleType: bimEngineerRoleType },
    create: {
      role: bimEngineerRoleName,
      roleType: bimEngineerRoleType,
    },
  });
  console.log(`UserRole "${bimEngineerRole.role}" (ID: ${bimEngineerRole.id}) ensured with roleType '${bimEngineerRole.roleType}'.`);

  // --- Map specific permissions to bimEngineer Role ---
  const bimEngineerPermissionsToAssign = [
    PERMISSIONS.CATALOGUE.MANAGE,
    PERMISSIONS.PROJECTS.VIEW,
  ];
  if (bimEngineerRole && allPermissionsInDb.length > 0) {
    for (const permString of bimEngineerPermissionsToAssign) {
      const permObject = allPermissionsInDb.find(p => p.permission === permString);
      if (permObject) {
        await prisma.rolePermissionMapping.upsert({
          where: { roleId_permissionId: { roleId: bimEngineerRole.id, permissionId: permObject.id } },
          update: {},
          create: { roleId: bimEngineerRole.id, permissionId: permObject.id },
        });
        console.log(`Permission "${permString}" mapped to role "${bimEngineerRole.role}".`);
      } else {
        console.warn(`Warning: Permission string "${permString}" not found. Skipping mapping for ${bimEngineerRole.role}.`);
      }
    }
  }
  
  // --- Seed projectManager Role ---
  const projectManagerRoleName = 'Project Manager'; // Changed to Title Case
  const projectManagerRoleType = 'INTERNAL';
  const projectManagerRole = await prisma.userRole.upsert({
    where: { role: projectManagerRoleName },
    update: { roleType: projectManagerRoleType },
    create: {
      role: projectManagerRoleName, // Uses Title Case
      roleType: projectManagerRoleType,
    },
  });
  console.log(`UserRole "${projectManagerRole.role}" (ID: ${projectManagerRole.id}) ensured with roleType '${projectManagerRole.roleType}'.`);

  // --- Map specific permissions to projectManager Role ---
  const projectManagerPermissionsToAssign = [
    PERMISSIONS.PROJECTS.VIEW,
    PERMISSIONS.PROJECTS.CREATE,
    PERMISSIONS.PROJECTS.EDIT,
    PERMISSIONS.TASKS.MANAGE,
  ];
  if (projectManagerRole && allPermissionsInDb.length > 0) {
    for (const permString of projectManagerPermissionsToAssign) {
      const permObject = allPermissionsInDb.find(p => p.permission === permString);
      if (permObject) {
        await prisma.rolePermissionMapping.upsert({
          where: { roleId_permissionId: { roleId: projectManagerRole.id, permissionId: permObject.id } },
          update: {},
          create: { roleId: projectManagerRole.id, permissionId: permObject.id },
        });
        console.log(`Permission "${permString}" mapped to role "${projectManagerRole.role}".`);
      } else {
        console.warn(`Warning: Permission string "${permString}" not found. Skipping mapping for ${projectManagerRole.role}.`);
      }
    }
  }

  // --- Seed designer Role ---
  const designerRoleName = 'Designer'; // Changed to Title Case
  const designerRoleType = 'EXTERNAL';
  const designerRole = await prisma.userRole.upsert({
    where: { role: designerRoleName },
    update: { roleType: designerRoleType },
    create: {
      role: designerRoleName, // Uses Title Case
      roleType: designerRoleType,
    },
  });
  console.log(`UserRole "${designerRole.role}" (ID: ${designerRole.id}) ensured with roleType '${designerRole.roleType}'.`);

  // --- Map specific permissions to designer Role ---
  const designerPermissionsToAssign = [
    PERMISSIONS.PROJECTS.VIEW,
  ];
  if (designerRole && allPermissionsInDb.length > 0) {
    for (const permString of designerPermissionsToAssign) {
      const permObject = allPermissionsInDb.find(p => p.permission === permString);
      if (permObject) {
        await prisma.rolePermissionMapping.upsert({
          where: { roleId_permissionId: { roleId: designerRole.id, permissionId: permObject.id } },
          update: {},
          create: { roleId: designerRole.id, permissionId: permObject.id },
        });
        console.log(`Permission "${permString}" mapped to role "${designerRole.role}".`);
      } else {
        console.warn(`Warning: Permission string "${permString}" not found. Skipping mapping for ${designerRole.role}.`);
      }
    }
  }

  // --- Remove old CLIENT role specific permission mappings if any linger (optional cleanup) ---
  // This part is more for manual cleanup if the CLIENT role was deleted but mappings remained.
  // The upsert logic for other roles should handle new assignments correctly.
  // Example: If 'tasks.update_status_as_client' was a permission.
  // const clientSpecificPerm = allPermissionsInDb.find(p => p.permission === 'tasks.update_status_as_client');
  // if (clientSpecificPerm) {
  //   await prisma.rolePermissionMapping.deleteMany({
  //     where: { permissionId: clientSpecificPerm.id } // Deletes this mapping from ALL roles it might have been on
  //   });
  //  console.log(`Cleaned up potential lingering mappings for "tasks.update_status_as_client".`);
  // }


  // --- Seed "Simple Box" ModelDefinition ---
  const simpleBoxModelName = 'Simple Box';
  await prisma.modelDefinition.upsert({
    where: { name: simpleBoxModelName },
    update: {
      description: 'A basic rectangular box model with configurable dimensions and material thickness.',
      imageUrl: 'url_placeholder.jpg', // Added placeholder
    },
    create: {
      name: simpleBoxModelName,
      description: 'A basic rectangular box model with configurable dimensions and material thickness.',
      imageUrl: 'url_placeholder.jpg', // Added placeholder
      inputParameters: {
        create: [
          { inputName: 'boxHeight', displayLabel: 'Box Height', inputType: 'NUMBER', unit: 'mm', defaultValue: '700', description: 'Overall height of the box.' },
          { inputName: 'boxWidth', displayLabel: 'Box Width', inputType: 'NUMBER', unit: 'mm', defaultValue: '600', description: 'Overall width of the box.' },
          { inputName: 'boxDepth', displayLabel: 'Box Depth', inputType: 'NUMBER', unit: 'mm', defaultValue: '550', description: 'Overall depth of the box.' },
          { inputName: 'leftAdjacency', displayLabel: 'Left Adjacency', inputType: 'SELECT', defaultValue: 'Expose', description: 'Specify what is to the left of this box.', options: ['Expose', 'Wall', 'Box'] },
          { inputName: 'rightAdjacency', displayLabel: 'Right Adjacency', inputType: 'SELECT', defaultValue: 'Expose', description: 'Specify what is to the right of this box.', options: ['Expose', 'Wall', 'Box'] },
          { inputName: 'exposeMaterialCode', displayLabel: 'Exposed Surfaces Material Code', inputType: 'TEXT', defaultValue: 'none', description: 'Material code for visible box surfaces.' },
          { inputName: 'innerMaterialCode', displayLabel: 'Internal Surfaces Material Code', inputType: 'TEXT', defaultValue: 'none', description: 'Material code for internal surfaces.' },
          { inputName: 'backMaterialCode', displayLabel: 'Back Panel Material Code', inputType: 'TEXT', defaultValue: 'none', description: 'Material code for the back panel.' },
        ]
      },
      bomItems: {
        create: [
          {
            itemName: 'Left Panel',
            itemType: BomItemType.PLANK,
            itemDescription: 'The vertical panel on the left side of the box.',
            details: {
              packetNumber: '1',
              plankLocation: 'LT',
              plankWidthLogic: "if (leftAdjacency === 'Expose') { plankWidth = boxDepth - doorPanel.thickness - (2 * leftPlank.edgeBandingThickness); } else { plankWidth = boxDepth - doorPanel.thickness - backPanel.thickness - (2 * leftPlank.edgeBandingThickness); }",
              plankHeightLogic: "plankHeight = boxHeight - (2 * leftPlank.edgeBandingThickness);",
              plankMaterialCodeLogic: "if (leftAdjacency === 'Expose') { plankMaterialCode = exposeMaterialCode; } else { plankMaterialCode = innerMaterialCode; }",
              plankIdLogic: "plankId = boxNumber + ':P' + packetNumber + ':' + plankLocation;",
              screwHolesLogic: "if (leftAdjacency !== 'Expose') screwHoles = [...];",
              vbScrewHolesLogic: "let holes = []; if (leftAdjacency === 'Expose') { /* ... */ } holes.push(/* ... */); context.result = holes;",
              backPanelGrooveLogic: "let groove = []; let tool; if (backPanel.thickness === 8) tool = T7; /* ... */ context.result = groove.length > 0 ? [groove] : [];",
            }
          },
          {
            itemName: 'Right Panel',
            itemType: BomItemType.PLANK,
            itemDescription: 'The vertical panel on the right side of the box.',
            details: {
              packetNumber: '1',
              plankLocation: 'RT',
              plankWidthLogic: "if (rightAdjacency === 'Expose') { plankWidth = boxDepth - doorPanel.thickness - (2 * rightPlank.edgeBandingThickness); } else { plankWidth = boxDepth - doorPanel.thickness - backPanel.thickness - (2 * rightPlank.edgeBandingThickness); }",
              plankHeightLogic: "plankHeight = boxHeight - (2 * rightPlank.edgeBandingThickness);",
              plankMaterialCodeLogic: "if (rightAdjacency === 'Expose') { plankMaterialCode = exposeMaterialCode; } else { plankMaterialCode = innerMaterialCode; }",
              plankIdLogic: "plankId = boxNumber + ':P' + packetNumber + ':' + plankLocation;",
              screwHolesLogic: "if (rightAdjacency !== 'Expose') screwHoles = [...];",
              vbScrewHolesLogic: "let holes = []; if (rightAdjacency === 'Expose') { /* ... */ } holes.push(/* ... */); context.result = holes;",
              backPanelGrooveLogic: "let groove = []; let tool; if (backPanel.thickness === 8) tool = T7; /* ... */ context.result = groove.length > 0 ? [groove] : [];",
            }
          },
          // TODO: Add Top Panel, Bottom Panel, Back Panel, Door Panel with similar 'details' structure
        ]
      },
    }
  });
  console.log(`ModelDefinition '${simpleBoxModelName}' seeded/ensured.`);

  // --- Seed Statuses ---
  const statusesToSeed = [
    { id: 1, status: 'Draft' },
    { id: 2, status: 'Active' },
    { id: 3, status: 'Completed' },
    { id: 4, status: 'Archived' },
    { id: 5, status: 'On Hold' },
  ];

  console.log('Seeding statuses...');
  for (const statusData of statusesToSeed) {
    await prisma.status.upsert({
      where: { id: statusData.id },
      update: { status: statusData.status },
      create: { id: statusData.id, status: statusData.status },
    });
  }
  console.log('Statuses seeded/ensured.');

  console.log('Seeding finished.');
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
