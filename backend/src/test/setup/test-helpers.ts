/**
 * Test Helpers
 * 
 * This file contains utility functions for testing.
 */

import { type Request, type Response, type NextFunction } from 'express';
import { vi } from 'vitest';
import jwt from 'jsonwebtoken';

// Extend the Express Request type to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: Record<string, any>;
    }
  }
}

/**
 * Create a mock Express request object
 * @param options Options for the mock request
 * @returns A mock Express request object
 */
export const mockRequest = (options: {
  body?: Record<string, any>;
  params?: Record<string, any>;
  query?: Record<string, any>;
  headers?: Record<string, any>;
  user?: Record<string, any>;
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
} = {}): Partial<Request> => {
  const req: Partial<Request> = {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
  };

  // Add file and files properties if provided
  if (options.file) {
    (req as any).file = options.file;
  }
  
  if (options.files) {
    (req as any).files = options.files;
  }

  // Add user property if provided
  if (options.user) {
    req.user = options.user;
  }

  return req;
};

/**
 * Create a mock Express response object
 * @returns A mock Express response object with spies
 */
export const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  res.sendStatus = vi.fn().mockReturnValue(res);
  res.cookie = vi.fn().mockReturnValue(res);
  res.clearCookie = vi.fn().mockReturnValue(res);
  res.redirect = vi.fn().mockReturnValue(res);
  
  return res;
};

/**
 * Create a mock next function for middleware testing
 * @returns A mock next function with a spy
 */
export const mockNext = vi.fn();

/**
 * Generate a mock JWT token for testing
 * @param payload The payload to include in the token
 * @returns A JWT token
 */
export const generateMockToken = (payload: Record<string, any>): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret');
};

/**
 * Create a mock authenticated request
 * @param role The role of the user (e.g., 'admin', 'user')
 * @param userId The ID of the user
 * @param additionalData Additional data to include in the user object
 * @returns A mock authenticated request
 */
export const mockAuthenticatedRequest = (
  role: string = 'user',
  userId: number = 1,
  additionalData: Record<string, any> = {}
): Partial<Request> => {
  return mockRequest({
    user: {
      id: userId,
      role: { role },
      ...additionalData,
    },
    headers: {
      authorization: `Bearer ${generateMockToken({ id: userId, role })}`,
    },
  });
};

/**
 * Create mock data for testing
 */
export const mockData = {
  users: [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'hashed-password',
      phoneNumber: '1234567890',
      verified: true,
      isActive: true,
      roleId: 1,
      role: { id: 1, role: 'admin', roleType: 'internal' },
    },
    {
      id: 2,
      name: 'Regular User',
      email: 'user@example.com',
      password: 'hashed-password',
      phoneNumber: '0987654321',
      verified: true,
      isActive: true,
      roleId: 2,
      role: { id: 2, role: 'user', roleType: 'external' },
    },
  ],
  projects: [
    {
      id: 1,
      name: 'Test Project 1',
      description: 'A test project',
      address: '123 Test St',
      location: 'Test City',
      sqft: 1000,
      statusId: 1,
      clientId: 2,
      engineerId: 1,
      createdById: 1,
      updatedById: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  tasks: [
    {
      id: 1,
      projectId: 1,
      name: 'Test Task 1',
      stage: 'Planning',
      statusId: 1,
      uploaderRole: 'admin',
      viewerRoles: 'admin,user',
      actionRequired: 'Complete the task',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  subtasks: [
    {
      id: 1,
      name: 'Test Subtask 1',
      description: 'A test subtask',
      actionRequired: 'Complete the subtask',
      type: 'information',
      completed: false,
      taskId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  materials: [
    {
      id: 1,
      projectId: 1,
      materialId: 'MAT-001',
      plyThickness: 18,
      innerLaminateCode: 'IL-001',
      outerLaminateCode: 'OL-001',
      overallThickness: 20,
      plyType: 'HDHMR',
      edgebandingInnerCode: 'EI-001',
      edgebandingExposedCode: 'EE-001',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};
