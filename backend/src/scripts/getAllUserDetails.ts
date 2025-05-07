import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getAllUserDetails() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        password: true, // Note: Storing and retrieving plain text passwords is a security risk.
        role: {
          select: {
            role: true,
          },
        },
      },
    });

    if (users.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    console.log('User Details:');
    users.forEach((user) => {
      console.log(
        `- Email: ${user.email}, Password: ${user.password}, Role: ${user.role.role}`
      );
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getAllUserDetails();
