import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getAllUserDetails() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: {
          select: {
            role: true,
          },
        },
      },
    });

    users.forEach((user) => {
      console.log(`User ID: ${user.id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Role: ${user.role?.role}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getAllUserDetails();
