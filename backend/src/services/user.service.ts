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
      take: parseInt(pageSize.toString(), 10),
    });

    return { users, total };
  }

  static async toggleUserActiveStatus(userId: number, isActive: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  }
}
