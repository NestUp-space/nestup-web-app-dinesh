import prisma from '../config/db';
import bcrypt from 'bcrypt';

async function registerTestUser() {
  try {
    // First check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'surya8352@gmail.com' }
    });

    if (existingUser) {
      console.log('User already exists');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('1234test', 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name: 'Surya Test',
        email: 'surya8352@gmail.com',
        phoneNumber: '9876543210', // Using a different test phone number
        password: hashedPassword,
        roleId: 1, // Assuming 1 is the client role ID
        verified: true,
        isActive: true
      }
    });

    console.log('User created successfully:', {
      id: user.id,
      email: user.email,
      name: user.name
    });

  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

registerTestUser();
