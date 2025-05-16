import { Response, NextFunction, RequestHandler } from 'express'; // Removed Request
import { PrismaClient } from '@prisma/client';
import { CustomRequest } from './auth.middleware';
import { hasRequiredPermissions, type PermissionOptions } from '../types/permissions';
import { StatusCodes } from 'http-status-codes';
import { ensureCustomRequest } from './customRequest.middleware';

const prisma = new PrismaClient();

// Cache layer for performance optimization
const permissionCache = new Map<number, Set<string>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getUserPermissions(userId: number): Promise<Set<string>> {
  if (permissionCache.has(userId)) {
    return permissionCache.get(userId)!;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: {
          roleMappings: {
            select: {
              permission: {
                select: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  const permissions = new Set(
    user?.role?.roleMappings.map(m => m.permission.permission) || []
  );

  // Cache the permissions with TTL
  permissionCache.set(userId, permissions);
  setTimeout(() => permissionCache.delete(userId), CACHE_TTL);

  return permissions;
}

export function hasPermission(
  requiredPermissions: string | string[],
  options: PermissionOptions = {}
): RequestHandler {
  const handler = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const perms = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

      const userPerms = await getUserPermissions(req.user.id);

      if (!hasRequiredPermissions(userPerms, perms, options)) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: `Insufficient permissions. Required: ${perms.join(', ')}`
        });
      }

      // If all checks pass, proceed to the next middleware
      return next(); // Explicitly return after calling next()
    } catch (error) {
      console.error('Error in permission middleware:', error);
      // Pass the error to the Express error handling middleware
      return next(error); 
    }
  };
  
  // The ensureCustomRequest likely wraps this to ensure req is CustomRequest.
  // The return type of ensureCustomRequest should be RequestHandler.
  return ensureCustomRequest(handler);
}

// Utility function to clear the permission cache for a specific user
// (useful when user's permissions are updated)
export function clearUserPermissionCache(userId: number): void {
  permissionCache.delete(userId);
}

// Utility function to clear the entire permission cache
// (useful when doing bulk permission updates)
export function clearAllPermissionCache(): void {
  permissionCache.clear();
}

export default {
  hasPermission,
  clearUserPermissionCache,
  clearAllPermissionCache
};
