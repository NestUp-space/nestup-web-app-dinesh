import { PrismaClient, Prisma } from '@prisma/client';
import { defaultProjectTaskTemplates } from '../src/constants/projectTaskTemplate';
import bcrypt from 'bcrypt'; // For hashing passwords

const prisma = new PrismaClient();

// Simpler type for user data passed to the seeder function
interface SeedUserData {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  verified?: boolean;
  isActive?: boolean;
  // Add any other non-relational fields you expect for a new user here
  // e.g. profilePicUrl?: string; 
}

async function ensureRoleAndUser(roleName: string, roleType: string, userData: SeedUserData ) {
  let role = await prisma.userRole.findFirst({ where: { role: roleName } });
  if (!role) {
    role = await prisma.userRole.create({
      data: {
        role: roleName,
        roleType: roleType, // e.g., 'admin_type', 'staff_type', 'customer_type' - adjust as needed
      },
    });
    console.log(`Created role: ${role.role} (ID: ${role.id})`);
  }

  let user = await prisma.user.findFirst({ where: { roleId: role.id } });
  if (!user) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    // Construct data for user creation carefully
    const userCreateData: Prisma.UserCreateInput = {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      phoneNumber: userData.phoneNumber,
      verified: userData.verified,
      isActive: userData.isActive,
      role: { 
        connect: { id: role.id } 
      }
      // Add other non-relational fields from userData if they exist and are part of User model
      // e.g. profilePicUrl: userData.profilePicUrl (if profilePicUrl is in userData type)
    };
    user = await prisma.user.create({ data: userCreateData });
    console.log(`Created user: ${user.name} with role ${role.role} (ID: ${user.id})`);
  }
  return user;
}

async function main() {
  console.log('Starting database seeding...');

  // 1. Ensure essential roles and users exist
  // Define the user data structure to match what's needed, excluding password and roleId initially
  const adminUserData = {
    name: 'Default Admin',
    email: 'admin@example.com',
    password: 'password123', // This will be hashed by ensureRoleAndUser
    phoneNumber: '0000000000', // Unique phone number
    verified: true,
    isActive: true,
  };
  const adminUser = await ensureRoleAndUser('admin', 'administrator', adminUserData);
  console.log(`Using admin user: ID ${adminUser.id} (${adminUser.name})`);

  const engineerUserData = {
    name: 'Default Engineer',
    email: 'engineer@example.com',
    password: 'password123',
    phoneNumber: '0000000001', // Unique phone number
    verified: true,
    isActive: true,
  };
  const engineerUser = await ensureRoleAndUser('engineer', 'staff', engineerUserData);
  if (engineerUser) {
    console.log(`Using engineer user: ID ${engineerUser.id} (${engineerUser.name})`);
  } else {
    console.warn('Could not ensure engineer user. Sample project may not have an assigned engineer.');
  }

  const clientUserData = {
    name: 'Default Client',
    email: 'client@example.com',
    password: 'password123',
    phoneNumber: '0000000002', // Unique phone number
    verified: true,
    isActive: true,
  };
  const clientUser = await ensureRoleAndUser('client', 'customer', clientUserData);
  if (clientUser) {
    console.log(`Using client user: ID ${clientUser.id} (${clientUser.name})`);
  } else {
    console.warn('Could not ensure client user. Sample project may not have an assigned client.');
  }
  
  // Ensure a default status exists (e.g., ID 1 for "Pending")
  const defaultStatusId = 1;
  let defaultStatus = await prisma.status.findUnique({ where: { id: defaultStatusId } });
  if (!defaultStatus) {
    // Attempt to create a default status if it doesn't exist
    try {
      defaultStatus = await prisma.status.create({
        data: { id: defaultStatusId, status: 'Pending' } // Or just { status: 'Pending' } if ID is auto-increment
      });
      console.log(`Created default status: ID ${defaultStatus.id} (${defaultStatus.status})`);
    } catch (statusError) {
       // If ID is auto-increment and we try to set it, it might fail. Try without ID.
       try {
        defaultStatus = await prisma.status.create({ data: { status: 'Pending' }});
        console.log(`Created default status (auto-increment ID): ID ${defaultStatus.id} (${defaultStatus.status})`);
       } catch (innerStatusError) {
        console.error(`Seeding cannot proceed: Default status with ID ${defaultStatusId} not found and could not be created. Error: ${innerStatusError}. Please ensure statuses exist or adjust seed script.`);
        return;
       }
    }
  }
  console.log(`Using default status: ID ${defaultStatus.id} (${defaultStatus.status})`);

  console.log('Deleting existing project-related data...');
  // Order of deletion is important due to foreign key constraints

  // Deleting records that depend on Task
  await prisma.subtask.deleteMany({});
  console.log('Deleted Subtask records.');
  await prisma.siteVisitBox.deleteMany({});
  console.log('Deleted SiteVisitBox records.');
  
  // Deleting records that depend on Project or Task
  // For File, need to nullify generatedPlankListFileId on Project first
  await prisma.project.updateMany({ data: { generatedPlankListFileId: null } });
  await prisma.file.deleteMany({}); // Assuming files are primarily task-related or okay to delete if project-related
  console.log('Deleted File records.');

  await prisma.userAction.deleteMany({});
  console.log('Deleted UserAction records.');
  await prisma.comment.deleteMany({});
  console.log('Deleted Comment records.');

  // Deleting records that depend on Project
  await prisma.task.deleteMany({});
  console.log('Deleted Task records.');
  await prisma.clientProjectMapping.deleteMany({});
  console.log('Deleted ClientProjectMapping records.');
  await prisma.engineerProjectMapping.deleteMany({});
  console.log('Deleted EngineerProjectMapping records.');
  await prisma.material.deleteMany({});
  console.log('Deleted Material records.');
  
  // Finally, delete Project records
  await prisma.project.deleteMany({});
  console.log('Deleted Project records.');

  console.log('Seeding new sample project...');

  const sampleProjectData: Prisma.ProjectCreateInput = {
    name: 'Alpha Test Project (Seeded)',
    description: 'This is a comprehensive sample project seeded into the database for testing purposes. It includes various details and a full set of default tasks and subtasks.',
    address: 'Plot 42, Innovation Drive, Tech Park',
    location: '12.9716,77.5946', // Bangalore coordinates
    sqft: 3200,
    status: { connect: { id: defaultStatusId } },
    createdBy: { connect: { id: adminUser.id } },
    updatedBy: { connect: { id: adminUser.id } },
    estimatedTime: new Date(new Date().getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    startedAt: new Date(),
    vbCount: 12,
    // Assign engineer and client if found
    ...(engineerUser && { engineer: { connect: { id: engineerUser.id } } }),
  };

  const newProject = await prisma.project.create({
    data: sampleProjectData,
  });
  console.log(`Created sample project: ${newProject.name} (ID: ${newProject.id})`);

  // Assign client using ClientProjectMapping if clientUser exists
  if (clientUser) {
    await prisma.clientProjectMapping.create({
      data: {
        projectId: newProject.id,
        clientId: clientUser.id,
      },
    });
    console.log(`Mapped client ${clientUser.name} to project ${newProject.name}`);
  }


  // Seed tasks and subtasks from the TypeScript template
  console.log(`Seeding tasks for project ID: ${newProject.id} using TypeScript template...`);
  for (const templateTask of defaultProjectTaskTemplates) {
    const taskData: Prisma.TaskCreateInput = {
      project: { connect: { id: newProject.id } },
      name: templateTask.taskName,
      stage: templateTask.stage,
      status: { connect: { id: templateTask.statusId || defaultStatusId } }, // Fallback to defaultStatusId
      uploaderRole: templateTask.uploaderRole,
      viewerRoles: Array.isArray(templateTask.viewerRoles)
        ? templateTask.viewerRoles.join(',')
        : templateTask.viewerRoles,
      actionRequired: templateTask.actionRequired,
      updatedBy: { connect: { id: adminUser.id } }, // Default updatedBy to admin
      // Optional fields like startedAt, completedAt can be added if needed
    };

    const createdTask = await prisma.task.create({ data: taskData });
    console.log(`  Created task: ${createdTask.name} (ID: ${createdTask.id})`);

    if (templateTask.subtasks && templateTask.subtasks.length > 0) {
      for (const templateSubtask of templateTask.subtasks) {
        const subtaskData: Prisma.SubtaskCreateInput = {
          task: { connect: { id: createdTask.id } },
          name: templateSubtask.name,
          description: templateSubtask.description,
          actionRequired: templateSubtask.actionRequired,
          type: templateSubtask.type,
          metadataJson: templateSubtask.metadataJson,
          completed: false, // Default to not completed
        };
        await prisma.subtask.create({ data: subtaskData });
        console.log(`    Created subtask: ${templateSubtask.name}`);
      }
    }
  }

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
