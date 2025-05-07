import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const superAdminRole = await prisma.userRole.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        role: 'super admin',
        roleType: 'admin',
      },
    });

    console.log('Super admin role created or already exists:', superAdminRole);
  } catch (error) {
    console.error('Error creating super admin role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
