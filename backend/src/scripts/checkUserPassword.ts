import prisma from '../config/db';
import bcrypt from 'bcrypt';

async function checkUserPassword() {
  const email = 'surya8352@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      isActive: true,
      verified: true
    }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('User found:', {
    id: user.id,
    email: user.email,
    isActive: user.isActive,
    verified: user.verified
  });

  // Test password match
  const testPassword = '1234test';
  const passwordMatch = await bcrypt.compare(testPassword, user.password);
  console.log('Password match:', passwordMatch);
}

checkUserPassword()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
