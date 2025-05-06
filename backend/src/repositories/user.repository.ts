import { PrismaClient, User, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @class UserRepository
 * @description Handles all database operations related to the User model.
 */
export class UserRepository {
  /**
   * @method findByPhoneNumber
   * @description Finds a user by their phone number.
   * @param {string} phoneNumber - The phone number of the user.
   * @returns {Promise<User | null>} The user object or null if not found.
   */
  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { phoneNumber },
    });
  }

  /**
   * @method create
   * @description Creates a new user.
   * @param {Prisma.UserUncheckedCreateInput} userData - The data for the new user.
   * @returns {Promise<User>} The created user object.
   */
  async create(userData: Prisma.UserUncheckedCreateInput): Promise<User> {
    return prisma.user.create({
      data: userData,
    });
  }

  // Add other user-related database methods here as needed
  // e.g., findById, update, delete, etc.
}

// Export an instance of the repository
export const userRepository = new UserRepository();
