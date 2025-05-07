import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { PrismaClient, User, UserRole } from '@prisma/client'; // Import User type
import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '../common/models/serviceResponse'; // Updated to use relative path

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
    // Let failure default to ServiceResponse<null>
    return ServiceResponse.failure(message, null, StatusCodes.BAD_REQUEST);
  }

  // Find the roleId for 'client' (assuming roleId 1 is client, adjust if needed)
  // TODO: Make this more robust, perhaps querying by role name if it's guaranteed unique or using a config
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
        verified: false, // Users start as unverified
        isActive: true,  // Users start as active
      },
    });

    // Exclude password from the returned user object
    const { password, ...userWithoutPassword } = user;
    // Use ServiceResponse.success for successful operations
    return ServiceResponse.success('User registered successfully. Please verify your email.', userWithoutPassword, StatusCodes.CREATED);

  } catch (error) {
    console.error("Error registering user:", error);
    // Let failure default to ServiceResponse<null>
    return ServiceResponse.failure('Failed to register user', null, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

// Adjust return type to allow ServiceResponse<null> on failure
export const loginUser = async (data: LoginUserData): Promise<ServiceResponse<{ token: string; user: Omit<User, 'password'> }> | ServiceResponse<null>> => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: {
      role: true, // Include the role details
    },
  });

  if (!user) {
    // Let failure default to ServiceResponse<null>
    return ServiceResponse.failure('Invalid credentials', null, StatusCodes.UNAUTHORIZED);
  }

  if (!user.isActive) {
    // Let failure default to ServiceResponse<null>
    return ServiceResponse.failure('Account is inactive. Please contact support.', null, StatusCodes.FORBIDDEN);
  }

  // Add email verification check later if implemented
  // if (!user.verified) {
  //   // Let failure default to ServiceResponse<null>
  //   return ServiceResponse.failure('Account not verified. Please check your email.', null, StatusCodes.FORBIDDEN);
  // }

  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    // Let failure default to ServiceResponse<null>
    return ServiceResponse.failure('Invalid credentials', null, StatusCodes.UNAUTHORIZED);
  }

  // Ensure JWT_SECRET is defined
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET environment variable is not defined.");
    // Let failure default to ServiceResponse<null>
    return ServiceResponse.failure('Authentication configuration error.', null, StatusCodes.INTERNAL_SERVER_ERROR);
  }

  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.role, // Use the role name from the included relation
  };

  const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' }); // Consider longer expiry or refresh tokens

  // Exclude password from the returned user object
  const { password, ...userWithoutPassword } = user;

  return ServiceResponse.success('Login successful', { token, user: userWithoutPassword }, StatusCodes.OK);
};

export const resetPassword = async (email: string): Promise<ServiceResponse<null>> => {
  // Placeholder for actual implementation
  console.log(`Password reset requested for ${email}`);
  // TODO: Implement token generation, email sending (e.g., using AWS SES), and storing the token securely.
  return ServiceResponse.failure('Password reset not implemented yet', null, StatusCodes.NOT_IMPLEMENTED);
};

export const getUserById = async (id: number): Promise<ServiceResponse<(Omit<User, 'password'> & { role: UserRole }) | null>> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true }, // Ensure role details are included
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
