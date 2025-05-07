import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { StatusCodes } from 'http-status-codes';

const prisma = new PrismaClient();

interface CreateUserProps {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  roleId?: number;
}

export class UserService {
  static async createUser({ email, password, name, phoneNumber, roleId = 1 }: CreateUserProps) {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phoneNumber,
        roleId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        isActive: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        // Exclude password for security
      },
    });
  }

  static async getUsers(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const total = await prisma.user.count();
    const users = await prisma.user.findMany({
      skip,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        isActive: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        // Exclude password for security
      },
    });

    return { users, total }; // Return both users and total count
  }

  static async toggleUserActiveStatus(userId: number, isActive: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        isActive: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        // Exclude password for security
      },
    });
  }

  static async getUserById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        isActive: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        // Exclude password for security
      },
    });
  }
  
  static async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        isActive: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        // Exclude password for security
      },
    });
  }
  
  static async getCurrentUserProfile(userId: number): Promise<ServiceResponse<any>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          phoneNumber: true,
          isActive: true,
          verified: true,
          profilePicUrl: true,
          createdAt: true,
          updatedAt: true,
          role: {
            select: {
              id: true,
              role: true,
              roleType: true
            }
          }
        },
      });

      if (!user) {
        return ServiceResponse.failure('User not found', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success('User profile retrieved successfully', user, StatusCodes.OK);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return ServiceResponse.failure('Failed to fetch user profile', null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
