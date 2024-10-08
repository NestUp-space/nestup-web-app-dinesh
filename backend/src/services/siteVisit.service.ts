import { PrismaClient, User, Project } from '@prisma/client';

const prisma = new PrismaClient();

export const createOrUpdateUser = async (name: string, phone: string): Promise<User> => {
  const existingUser = await prisma.user.findUnique({
    where: { phoneNumber: phone }
  });

  if (existingUser) {
    return existingUser;
  }

  return prisma.user.create({
    data: {
      name,
      phoneNumber: phone,
      email: `${phone}@placeholder.com`, // Placeholder email
      password: 'placeholder', // Placeholder password
      verified: false,
      roleId: 1, // Assuming 1 is the roleId for clients
    }
  });
};

export const createDraftProject = async (
  userId: number,
  name: string,
  address: string,
  location: string,
  preferredSlot: Date
): Promise<Project> => {
  return prisma.project.create({
    data: {
      name,
      address,
      location,
      sqft: 0, // Default value
      statusId: 1, // Assuming 1 is the statusId for draft projects
      clientId: userId,
      engineerId: 1, // Placeholder engineerId
      createdById: userId,
      updatedById: userId,
      estimatedTime: preferredSlot,
      vbCount: 0, // Default value
    }
  });
};