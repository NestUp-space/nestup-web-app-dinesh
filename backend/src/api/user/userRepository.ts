import prisma from "@/config/db";
import type { User } from "@prisma/client";


export class UserRepository {
  async findAllAsync(): Promise<User[]> {
    // Implementation for finding all users
    return prisma.user.findMany();
  }

  async findByIdAsync(id: number): Promise<User | null> {
    // Implementation for finding a user by ID
    return prisma.user.findUnique({ where: { id } });
  }

  async createAsync(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    // Implementation for creating a new user
    return prisma.user.create({ data });
  }
}
