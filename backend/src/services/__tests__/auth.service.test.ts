import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcrypt';
import { registerUser, loginUser, getUserById } from '../auth.service';
import { prismaMock } from '@/test/setup/prisma.mock';
import { mockData } from '@/test/setup/test-helpers'; // Assuming mockData is in test-helpers

// Mock the db import from '../config/db' as it's used by auth.service.ts
// The actual prismaMock from '@/test/setup/prisma.mock.ts' will be used due to vi.mock('@prisma/client')
vi.mock('../config/db', () => ({
  __esModule: true,
  default: prismaMock,
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.resetAllMocks(); // Reset all mocks defined in setup.ts and here
    // Specifically reset prismaMock if not covered by global reset for all models
    // This is often handled by resetPrismaMock in global setup, but explicit here for clarity
    Object.keys(prismaMock).forEach(key => {
        if (typeof (prismaMock as any)[key] === 'object' && (prismaMock as any)[key] !== null) {
            Object.keys((prismaMock as any)[key]).forEach(methodKey => {
                if (typeof (prismaMock as any)[key][methodKey]?.mockReset === 'function') {
                    (prismaMock as any)[key][methodKey].mockReset();
                }
            });
        } else if (typeof (prismaMock as any)[key]?.mockReset === 'function') {
            (prismaMock as any)[key].mockReset();
        }
    });
  });

  describe('registerUser', () => {
    const registerUserData = {
      name: 'Test User',
      email: 'test@example.com',
      phoneNumber: '1234567890',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      const mockUser = { ...mockData.users[0], ...registerUserData, id: 3, roleId: 1 };
      delete (mockUser as any).role; // Prisma create won't return nested role by default

      prismaMock.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as unknown as MockInstance<any>).mockResolvedValue('hashedPassword123');
      prismaMock.user.create.mockResolvedValue(mockUser as any);

      const response = await registerUser(registerUserData);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(StatusCodes.CREATED);
      expect(response.message).toBe('User registered successfully. Please verify your email.');
      expect(response.responseObject).toEqual(expect.objectContaining({ email: registerUserData.email }));
      expect(response.responseObject).not.toHaveProperty('password');
      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: registerUserData.email,
            password: 'hashedPassword123',
            roleId: 1, // Default client role
          }),
        })
      );
    });

    it('should return failure if email already exists', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockData.users[0] as any);
      const response = await registerUser(registerUserData);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(response.message).toBe('User with this email already exists');
      expect(response.responseObject).toBeNull();
    });

    it('should return failure if phone number already exists', async () => {
      const existingUserByPhone = { ...mockData.users[0], email: 'other@example.com', phoneNumber: registerUserData.phoneNumber };
      prismaMock.user.findFirst.mockResolvedValue(existingUserByPhone as any);
      const response = await registerUser(registerUserData);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(response.message).toBe('User with this phone number already exists');
      expect(response.responseObject).toBeNull();
    });
    
    it('should handle database errors during registration', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as unknown as MockInstance<any>).mockResolvedValue('hashedPassword123');
      prismaMock.user.create.mockRejectedValue(new Error('DB error'));

      const response = await registerUser(registerUserData);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.message).toBe('Failed to register user');
      expect(response.responseObject).toBeNull();
    });
  });

  describe('loginUser', () => {
    const loginUserData = {
      email: 'admin@example.com',
      password: 'correct-password', // Matches mock in setup.ts
    };
    const mockUserWithRole = { ...mockData.users[0], role: { id: 1, role: 'admin', roleType: 'admin' } };


    it('should login user successfully and return a token', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUserWithRole as any);
      // bcrypt.compare is mocked globally in setup.ts
      // jwt.sign is mocked globally in setup.ts

      const response = await loginUser(loginUserData);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(response.message).toBe('Login successful');
      expect(response.responseObject).toHaveProperty('token', 'test-token');
      expect(response.responseObject?.user).toEqual(expect.objectContaining({ email: loginUserData.email }));
      expect(response.responseObject?.user).not.toHaveProperty('password');
    });

    it('should return failure for non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const response = await loginUser(loginUserData);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED);
      expect(response.message).toBe('Invalid credentials');
    });

    it('should return failure for inactive user', async () => {
      const inactiveUser = { ...mockUserWithRole, isActive: false };
      prismaMock.user.findUnique.mockResolvedValue(inactiveUser as any);
      const response = await loginUser(loginUserData);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(StatusCodes.FORBIDDEN);
      expect(response.message).toBe('Account is inactive. Please contact support.');
    });

    it('should return failure for incorrect password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUserWithRole as any);
      (bcrypt.compare as unknown as MockInstance<any>).mockResolvedValue(false); // Override global mock for this test

      const response = await loginUser({ ...loginUserData, password: 'wrong-password' });
      
      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED);
      expect(response.message).toBe('Invalid credentials');
    });

    it('should return failure if JWT_SECRET is not defined', async () => {
      const originalJwtSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET; // Simulate undefined secret

      prismaMock.user.findUnique.mockResolvedValue(mockUserWithRole as any);
      (bcrypt.compare as unknown as MockInstance<any>).mockResolvedValue(true);

      const response = await loginUser(loginUserData);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.message).toBe('Authentication configuration error.');
      
      process.env.JWT_SECRET = originalJwtSecret; // Restore
    });
  });

  describe('getUserById', () => {
    const userId = 1;
    const mockUserWithRole = { ...mockData.users[0], role: { id: 1, role: 'admin', roleType: 'admin' } };

    it('should return user details if user is found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUserWithRole as any);
      const response = await getUserById(userId);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(response.message).toBe('User fetched successfully');
      expect(response.responseObject).toEqual(expect.objectContaining({ id: userId }));
      expect(response.responseObject).not.toHaveProperty('password');
      expect(response.responseObject).toHaveProperty('role');
    });

    it('should return failure if user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const response = await getUserById(999); // Non-existent ID

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(StatusCodes.NOT_FOUND);
      expect(response.message).toBe('User not found');
    });

    it('should handle database errors during user fetching', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('DB error'));
      const response = await getUserById(userId);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.message).toBe('Failed to fetch user');
    });
  });
});
