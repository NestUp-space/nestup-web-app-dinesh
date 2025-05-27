/**
 * Global Test Setup
 * 
 * This file contains the global setup for tests.
 * It is referenced in the Vitest configuration.
 */

import { vi, beforeEach, afterAll } from 'vitest';
import { prismaMock } from './prisma.mock';

// Set up global environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock Prisma Client globally
vi.mock('@prisma/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@prisma/client')>();
  return {
    ...actual,
    PrismaClient: vi.fn(() => prismaMock),
  };
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

// Clean up after all tests
afterAll(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

// Mock console methods to reduce noise in test output
// Comment these out if you want to see console output during tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'info').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
// Keep error logging enabled for debugging
// vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock environment variables
vi.mock('@/common/utils/envConfig', () => ({
  env: {
    JWT_SECRET: 'test-jwt-secret',
    CORS_ORIGIN: '*',
    // Add other environment variables as needed
  },
}));

// Mock AWS S3 if used in the application
vi.mock('aws-sdk', () => {
  const S3MockInstance = {
    upload: vi.fn().mockReturnThis(),
    promise: vi.fn().mockResolvedValue({ Location: 'https://test-bucket.s3.amazonaws.com/test-file.jpg' }),
  };
  
  return {
    S3: vi.fn(() => S3MockInstance),
  };
});

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  sign: vi.fn().mockReturnValue('test-token'),
  verify: vi.fn().mockImplementation((token, secret, callback) => {
    if (token === 'valid-token') {
      return { userId: 1, role: 'admin' };
    } else {
      throw new Error('Invalid token');
    }
  }),
}));

// Mock bcryptjs (the actual package being used)
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn().mockImplementation((password, hash) => {
      return Promise.resolve(password === 'correct-password');
    }),
  },
  hash: vi.fn().mockResolvedValue('hashed-password'),
  compare: vi.fn().mockImplementation((password, hash) => {
    return Promise.resolve(password === 'correct-password');
  }),
}));
