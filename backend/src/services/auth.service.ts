import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import type { User, UserRole } from '@prisma/client';
import { clearAllPermissionCache } from '../middlewares/permission.middleware';
import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '../common/models/serviceResponse';

// Define expected input structure for clarity
interface RegisterUserData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  roleName?: string; // Optional role name, defaults to 'client'
}

interface LoginUserData {
  email: string;
  password: string;
}

// Adjust return type to allow ServiceResponse<null> on failure
export const registerUser = async (data: RegisterUserData): Promise<ServiceResponse<Omit<User, 'password'>> | ServiceResponse<null>> => {
  // Check for existing user by email or phone
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: data.email },
        { phoneNumber: data.phoneNumber },
      ],
    },
  });

  if (existingUser) {
    const message = existingUser.email === data.email
      ? 'User with this email already exists'
      : 'User with this phone number already exists';
    return ServiceResponse.failure(message, null, StatusCodes.BAD_REQUEST);
  }

  const roleId = 1; // Hardcoding roleId 1 for 'client' for now
  const hashedPassword = await bcrypt.hash(data.password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: hashedPassword,
        roleId: roleId,
        verified: false,
        isActive: true,
      },
    });

    const { password, ...userWithoutPassword } = user;
    return ServiceResponse.success('User registered successfully. Please verify your email.', userWithoutPassword, StatusCodes.CREATED);

  } catch (error) {
    console.error("Error registering user:", error);
    return ServiceResponse.failure('Failed to register user', null, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

// Adjust return type to allow ServiceResponse<null> on failure
export const loginUser = async (data: LoginUserData): Promise<ServiceResponse<{ token: string; user: Omit<User, 'password'> }> | ServiceResponse<null>> => {
  console.log('Login attempt for email:', data.email);
  
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: {
      role: {
        include: {
          roleMappings: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  console.log('User found (with role mappings):', user ? {
    id: user.id,
    email: user.email,
    isActive: user.isActive,
    verified: user.verified,
    roleId: user.roleId,
    roleType: user.role?.roleType
  } : 'No user found');

  if (!user) {
    return ServiceResponse.failure('Invalid credentials', null, StatusCodes.UNAUTHORIZED);
  }

  if (!user.isActive) {
    console.log('User account is inactive:', user.email);
    return ServiceResponse.failure('Account is inactive. Please contact support.', null, StatusCodes.FORBIDDEN);
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  console.log('Password validation result:', isPasswordValid);
  
  if (!isPasswordValid) {
    return ServiceResponse.failure('Invalid credentials', null, StatusCodes.UNAUTHORIZED);
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET environment variable is not defined.");
    return ServiceResponse.failure('Authentication configuration error.', null, StatusCodes.INTERNAL_SERVER_ERROR);
  }

  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.roleType,
  };

  const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

  // Extract permissions similar to UserService.getCurrentUserProfile
  const permissions = user.role?.roleMappings?.map(
    (mapping) => mapping.permission?.permission
  ).filter(p => p) || [];

  // Create a user object for the response that includes the flat permissions array
  // and excludes the password and the detailed roleMappings.
  const { password, role, ...userBasicInfo } = user;
  const userForResponse = {
    ...userBasicInfo,
    role: { // Include basic role info
      id: role.id,
      role: role.role,
      roleType: role.roleType,
    },
    permissions, // Add the flat permissions array
  };

  // Clear permission cache on successful login
  clearAllPermissionCache();
  console.log('[AuthService] Permission cache cleared after successful login for user:', user.email);

  console.log('Login successful for:', user.email);
  console.log('User object being sent in login response:', JSON.stringify(userForResponse, null, 2));
  return ServiceResponse.success('Login successful', { token, user: userForResponse }, StatusCodes.OK);
};

export const resetPassword = async (email: string): Promise<ServiceResponse<null>> => {
  console.log(`Password reset requested for ${email}`);
  return ServiceResponse.failure('Password reset not implemented yet', null, StatusCodes.NOT_IMPLEMENTED);
};

export const getUserById = async (id: number): Promise<ServiceResponse<(Omit<User, 'password'> & { role: UserRole }) | null>> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      return ServiceResponse.failure('User not found', null, StatusCodes.NOT_FOUND);
    }

    const { password, ...userWithoutPassword } = user;
    return ServiceResponse.success('User fetched successfully', userWithoutPassword, StatusCodes.OK);

  } catch (error) {
    console.error(`Error fetching user by ID ${id}:`, error);
    return ServiceResponse.failure('Failed to fetch user', null, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};
