import { vi } from 'vitest';

// This is a common way to mock Prisma with Vitest.
// We are essentially creating an object that looks like PrismaClient,
// but all its methods are Vitest mocks.

const prismaMock = {
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    // Add other model methods you use in tests
  },
  // Add other models as needed, e.g.:
  // post: {
  //   findFirst: vi.fn(),
  //   create: vi.fn(),
  // },
  // ... other models
};

export { prismaMock };
