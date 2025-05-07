import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    const hashedPassword = await bcrypt.hash('superadminpassword', 10);

    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@example.com' },
      update: {},
      create: {
        name: 'Super Admin',
        email: 'superadmin@example.com',
        password: hashedPassword,
        phoneNumber: '1234567890',
        roleId: 1, // Assuming roleId 1 is for 'super admin'
        verified: true,
        isActive: true,
      },
    });

    console.log('Super admin user created or already exists:', superAdmin);
  } catch (error) {
    console.error('Error creating super admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
