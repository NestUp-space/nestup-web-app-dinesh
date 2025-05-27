import { mockDeep, DeepMockProxy } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Create a deep mock of PrismaClient using vitest-mock-extended
// This provides full type safety and automatically mocks all methods
export const prismaMock: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();

// Export for backward compatibility
export { prismaMock as default };
