import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateProjectsToNewRoles() {
  try {
    console.log('Starting project role migration...');

    // Find an admin user to assign as designer and project manager
    const adminUserResult = await prisma.$queryRaw`
      SELECT u.id FROM "User" u
      JOIN "UserRole" r ON u."roleId" = r.id
      WHERE r.role = 'admin'
      LIMIT 1
    `;

    if (!adminUserResult || (adminUserResult as any[]).length === 0) {
      console.log("No admin user found. Please create an admin user first.");
      return;
    }

    const adminUserId = (adminUserResult as any[])[0].id;
    console.log(`Using admin user ID ${adminUserId} as default designer and project manager`);

    // Find projects that need migration
    const projectsResult = await prisma.$queryRaw`
      SELECT id FROM "Project"
    `;

    const projects = projectsResult as any[];
    console.log(`Found ${projects.length} projects to migrate`);

    // Update all projects at once
    if (projects.length > 0) {
      const updateResult = await prisma.$executeRaw`
        UPDATE "Project"
        SET "designerId" = ${adminUserId},
            "projectManagerId" = ${adminUserId}
        WHERE "designerId" IS NULL OR "projectManagerId" IS NULL
      `;

      console.log(`Updated ${updateResult} projects with default designer and project manager`);
    }

    console.log('Project role migration completed successfully!');
  } catch (error) {
    console.error('Error during project role migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if this script is run directly
if (require.main === module) {
  migrateProjectsToNewRoles()
    .catch(error => {
      console.error('Error running migration script:', error);
      process.exit(1);
    });
}

export { migrateProjectsToNewRoles };
