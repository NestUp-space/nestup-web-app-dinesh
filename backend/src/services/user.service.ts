import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateUserProps {
  email: string;
  password: string;
  role: string;
}

export class UserService {
  static async createUser({ email, password, role }: CreateUserProps) {
    return prisma.user.create({
      data: {
        email,
        password,
        role,
      },
    });
  }

  static async getUsers(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const total = await prisma.user.count();
    const users = await prisma.user.findMany({
      skip,
      take: pageSize,
    });

    return { users, total }; // Return both users and total count
  }

  static async toggleUserActiveStatus(userId: number, isActive: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  }

  static async getUserById(id: number) {
    return prisma.user.findUnique({
      where: { id },
    });
  }
}
