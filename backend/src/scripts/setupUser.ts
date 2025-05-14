import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get or create admin role
    let adminRole = await prisma.userRole.findFirst({
      where: {
        roleType: 'ADMIN'
      }
    });

    if (!adminRole) {
      adminRole = await prisma.userRole.create({
        data: {
          role: 'Admin',
          roleType: 'ADMIN'
        }
      });
      console.log('Created admin role:', adminRole);
    } else {
      console.log('Using existing admin role:', adminRole);
    }

    // Create admin user (only if it doesn't exist)
    const existingUser = await prisma.user.findUnique({
      where: {
        email: 'admin@nestup.com'
      }
    });

    if (existingUser) {
      console.log('Admin user already exists:', {
        id: existingUser.id,
        email: existingUser.email
      });
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@nestup.com',
        password: hashedPassword,
        phoneNumber: '1234567890',
        verified: true,
        isActive: true,
        roleId: adminRole.id
      },
      include: {
        role: true
      }
    });

    console.log('Created admin user:', {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      roleId: adminUser.roleId,
      roleName: adminUser.role.roleType
    });

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
