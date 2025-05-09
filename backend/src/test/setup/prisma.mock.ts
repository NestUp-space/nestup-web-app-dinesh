/**
 * Prisma Mock Utility
 * 
 * This utility provides a way to mock the Prisma client for unit tests.
 * It creates a mock implementation of the Prisma client that can be used
 * to test services and repositories without hitting the actual database.
 */

import { PrismaClient } from '@prisma/client';
import { vi } from 'vitest';
import { DeepMockProxy, mockDeep, mockReset } from 'vitest-mock-extended';

// Create a mock Prisma client type
export type MockPrismaClient = DeepMockProxy<PrismaClient>;

// Create a singleton mock Prisma client
export const prismaMock = mockDeep<PrismaClient>() as unknown as MockPrismaClient;

// Mock the Prisma client module
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => prismaMock),
}));

/**
 * Reset the Prisma mock before each test
 * This should be called in a beforeEach hook in your test files
 */
export const resetPrismaMock = () => {
  mockReset(prismaMock);
};

/**
 * Helper function to create a mock for a specific Prisma model
 * @param modelName The name of the Prisma model to mock
 * @returns A mock implementation of the specified Prisma model
 * 
 * @example
 * // Mock the User model
 * const userMock = createModelMock('user');
 * // Set up a mock implementation for findUnique
 * userMock.findUnique.mockResolvedValue({ id: 1, name: 'Test User' });
 */
export const createModelMock = (modelName: keyof PrismaClient) => {
  return prismaMock[modelName];
};

/**
 * Helper function to mock a transaction
 * @param mockFn The function to mock within the transaction
 * @returns A mock implementation of the transaction
 * 
 * @example
 * // Mock a transaction that creates a user
 * prismaMock.$transaction.mockImplementation(mockTransaction(async (tx) => {
 *   tx.user.create.mockResolvedValue({ id: 1, name: 'Test User' });
 *   return { id: 1, name: 'Test User' };
 * }));
 */
export const mockTransaction = <T>(mockFn: (tx: MockPrismaClient) => Promise<T>) => {
  return async () => {
    return await mockFn(prismaMock);
  };
};
