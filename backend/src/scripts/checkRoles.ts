import prisma from '../config/db';

async function checkRoles() {
  try {
    const roles = await prisma.userRole.findMany();
    console.log('All User Roles:');
    roles.forEach(role => {
      console.log(`ID: ${role.id}, Role: ${role.role}, RoleType: ${role.roleType}`);
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles();
