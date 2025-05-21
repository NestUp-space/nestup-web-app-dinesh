import { PrismaClient, BomItemType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getAllPermissions as getAllPermissionStrings } from '../src/constants/permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // --- Seed Permissions ---
  const allPermissionNames = getAllPermissionStrings();
  console.log(`Found ${allPermissionNames.length} permissions to seed.`);
  for (const permName of allPermissionNames) {
    await prisma.userPermission.upsert({ // Corrected model name
      where: { permission: permName },
      update: {},
      create: { permission: permName },
    });
  }
  console.log('Permissions seeded/ensured.');
  const allPermissionsInDb = await prisma.userPermission.findMany(); // Corrected model name

  // --- Seed Admin UserRole ---
  const adminRoleName = 'admin';
  const adminRoleType = 'admin';
  // Assuming UserRole.role is now @unique
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
  // Assuming RolePermissionMapping has @@unique([roleId, permissionId])
  if (adminRole && allPermissionsInDb.length > 0) {
    console.log(`Mapping ${allPermissionsInDb.length} permissions to role '${adminRole.role}' (ID: ${adminRole.id}).`);
    for (const perm of allPermissionsInDb) {
      await prisma.rolePermissionMapping.upsert({
        where: {
          roleId_permissionId: { // Default name for compound unique constraint
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
  const adminUserEmail = 'admin@nestup.com';
  const adminUserName = 'Admin User';
  const adminUserPassword = 'DefaultAdminPassword123!'; 
  const adminUserPhoneNumber = '0000000000_seed'; // Placeholder for required phoneNumber
  const hashedAdminPassword = await bcrypt.hash(adminUserPassword, 10);

  let dbAdminUser = await prisma.user.findUnique({ // Renamed variable to avoid conflict
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
              phoneNumber: adminUserPhoneNumber, // Added required field
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
      console.log(`Updating admin user '${adminUserEmail}' to role '${adminRole.role}'.`);
    }
    if (dbAdminUser.phoneNumber !== adminUserPhoneNumber) { // Example: update phone if different
        updates.phoneNumber = adminUserPhoneNumber;
    }
    // Uncomment to force password update on existing admin user.
    /*
    if (!(await bcrypt.compare(adminUserPassword, dbAdminUser.password))) {
        updates.password = hashedAdminPassword;
        console.log(`Updating password for admin user '${adminUserEmail}'. PLEASE CHANGE THE DEFAULT PASSWORD if this was unexpected.`);
    }
    */
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

  // --- Seed "BIM_ENGINEER" Role (for context, if needed elsewhere) ---
  // Assuming UserRole.role is @unique
  const bimEngineerRole = await prisma.userRole.upsert({
    where: { role: 'BIM_ENGINEER' },
    update: { roleType: 'INTERNAL'},
    create: {
      role: 'BIM_ENGINEER',
      roleType: 'INTERNAL',
    },
  });
  console.log(`UserRole "BIM_ENGINEER" (ID: ${bimEngineerRole.id}) ensured.`);

  // --- Seed "Client" Role ---
  const clientRole = await prisma.userRole.upsert({
    where: { role: 'CLIENT' },
    update: { roleType: 'EXTERNAL' },
    create: {
      role: 'CLIENT',
      roleType: 'EXTERNAL',
    },
  });
  console.log(`UserRole "CLIENT" (ID: ${clientRole.id}) ensured.`);

  // --- Map specific task permissions to roles ---
  const taskUpdateAsClientPerm = allPermissionsInDb.find(p => p.permission === 'tasks.update_status_as_client');
  if (clientRole && taskUpdateAsClientPerm) {
    await prisma.rolePermissionMapping.upsert({
      where: { roleId_permissionId: { roleId: clientRole.id, permissionId: taskUpdateAsClientPerm.id } },
      update: {},
      create: { roleId: clientRole.id, permissionId: taskUpdateAsClientPerm.id },
    });
    console.log(`Permission "tasks.update_status_as_client" mapped to role "CLIENT".`);
  }

  const taskUpdateAsBimPerm = allPermissionsInDb.find(p => p.permission === 'tasks.update_status_as_bim_engineer');
  if (bimEngineerRole && taskUpdateAsBimPerm) {
    await prisma.rolePermissionMapping.upsert({
      where: { roleId_permissionId: { roleId: bimEngineerRole.id, permissionId: taskUpdateAsBimPerm.id } },
      update: {},
      create: { roleId: bimEngineerRole.id, permissionId: taskUpdateAsBimPerm.id },
    });
    console.log(`Permission "tasks.update_status_as_bim_engineer" mapped to role "BIM_ENGINEER".`);
  }

  // --- Seed "Simple Box" ModelDefinition (UPDATED as per your request) ---
  const simpleBoxModelName = 'Simple Box';
  await prisma.modelDefinition.upsert({
    where: { name: simpleBoxModelName },
    update: { 
        description: 'A basic rectangular box model with configurable dimensions and material thickness.',
        imageUrl: 'url', 
    },
    create: {
      name: simpleBoxModelName,
      description: 'A basic rectangular box model with configurable dimensions and material thickness.',
      imageUrl: 'url', 
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
      // modelScopedVariables removed as it's not in schema.prisma ModelDefinition
      // availableAddons removed as it's not in schema.prisma ModelDefinition
      bomItems: { 
        create: [
          {
            itemName: 'Left Panel',
            itemType: BomItemType.PLANK, 
            itemDescription: 'The vertical panel on the left side of the box.',
            details: { // Storing plankProperties in 'details' JSON field
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
            details: { // Storing plankProperties in 'details' JSON field
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
          // Add Top Panel, Bottom Panel, Back Panel, Door Panel with similar 'details' structure
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
