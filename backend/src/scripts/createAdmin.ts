import bcrypt from 'bcrypt';
import prisma from '../config/db';  // Make sure this path is correct based on your setup

const createAdmin = async () => {
  const email = 'suryanestup@gmail.com';
  const password = 'Password@123';
  const role = 'admin'; // Set role to super-admin

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });
    console.log('Admin created:', user);
  } catch (error) {
    console.error('Error creating Admin:', error);
  } finally {
    await prisma.$disconnect();
  }
};

createAdmin();
