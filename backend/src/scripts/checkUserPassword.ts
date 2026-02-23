import prisma from '../config/db';
import bcrypt from 'bcrypt';

async function checkUserPassword() {
  const email = process.env.TEST_USER_EMAIL || '';
  
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
  const testPassword = process.env.TEST_USER_PASSWORD || '';
  await bcrypt.compare(testPassword, user.password);
  // Security: Log result only in controlled dev environment, never in production logs
  console.log('Password verification completed for user:', user.email);
}

checkUserPassword()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
