import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // First, find all users with their role info
    console.log('\nCurrent users:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        verified: true,
        role: {
          select: {
            id: true,
            role: true,
            roleType: true
          }
        }
      }
    });

    console.log(JSON.stringify(users, null, 2));

    // Update users without roleId 1 to have roleId 1
    const updatedUsers = await prisma.user.updateMany({
      where: {
        NOT: { roleId: 1 }
      },
      data: {
        roleId: 1,
        verified: true // Also set verified to true
      }
    });

    console.log('\nUpdate results:', updatedUsers);

    // Verify the changes
    console.log('\nVerifying changes...');
    const verifiedUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        verified: true,
        role: {
          select: {
            id: true,
            role: true,
            roleType: true
          }
        }
      }
    });

    console.log(JSON.stringify(verifiedUsers, null, 2));

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
