import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Changed from 'bcrypt'
import { ServiceResponse } from '../common/models/serviceResponse';
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

  static async updateUserPassword(userId: number, newPassword: string) {
    // Hash the new password before updating
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
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

  static async getUsers(page: number, pageSize: number, roleName?: string) {
    const skip = (page - 1) * pageSize;
    let whereClause = {};

    if (roleName) {
      whereClause = {
        role: {
          role: roleName,
        },
      };
    }

    const total = await prisma.user.count({ where: whereClause });
    const users = await prisma.user.findMany({
      skip,
      take: pageSize,
      where: whereClause,
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
      console.log(`[UserService.getCurrentUserProfile] Fetching profile for userId: ${userId}`);
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
                  roleType: true,
                  roleMappings: {
                    select: {
                      permission: {
                        select: {
                          permission: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });

      console.log('[UserService.getCurrentUserProfile] Raw user data from DB:', JSON.stringify(user, null, 2));

      if (!user) {
        console.log('[UserService.getCurrentUserProfile] User not found in DB.');
        return ServiceResponse.failure('User not found', null, StatusCodes.NOT_FOUND);
      }

      // Extract permissions
      const permissions = user.role?.roleMappings?.map(
        (mapping) => mapping.permission?.permission
      ).filter(p => p) || [];
      
      console.log('[UserService.getCurrentUserProfile] Extracted permissions:', JSON.stringify(permissions, null, 2));

      const userProfile = {
        ...user,
        permissions,
      };
      // Remove roleMappings from the final user object if it's not needed directly by the frontend
      // For now, let's assume the frontend might only need the flat list of permissions
      // and the original role object.
      // @ts-ignore
      delete userProfile.role?.roleMappings;

      console.log('[UserService.getCurrentUserProfile] Final userProfile to be returned:', JSON.stringify(userProfile, null, 2));
      console.log('[UserService.getCurrentUserProfile] Final permissions array in userProfile:', JSON.stringify(userProfile.permissions, null, 2));

      return ServiceResponse.success('User profile retrieved successfully', userProfile, StatusCodes.OK);
    } catch (error) {
      console.error('[UserService.getCurrentUserProfile] Error fetching user profile (Prisma Error):', error); // Enhanced logging
      return ServiceResponse.failure('Failed to fetch user profile', null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  static async getUsersByRole(roleName: string) {
    // For other roleNames, correct common incorrect casings/formats from the browser
    // If roleName is already correct TitleCase and not matched above, it will be used as is.
    // If roleName is an unhandled incorrect variation, it might not find users.

    return prisma.user.findMany({
      where: {
        role: {
          role: roleName, // Query by the exact role name string
        },
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

  static async updateUserRole(userId: number, roleId: number) {
    return prisma.user.update({
      where: { id: userId },
      data: { roleId },
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
}
