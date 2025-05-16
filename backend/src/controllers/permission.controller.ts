import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getAllPermissions } from '../constants/permissions';
import { UserService } from '../services/user.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PermissionController {
  static async getAllPermissions(_req: Request, res: Response) {
    try {
      const permissions = getAllPermissions();
      res.status(StatusCodes.OK).json({
        success: true,
        permissions
      });
    } catch (err) {
      console.error('Error fetching permissions:', err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to fetch permissions',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  static async getPermissionsByRoleId(req: Request, res: Response) {
    try {
      const roleId = parseInt(req.params.roleId);
      const rolePermissions = await prisma.rolePermissionMapping.findMany({
        where: { roleId },
        select: {
          permission: {
            select: { permission: true }
          }
        }
      });

      const permissions = rolePermissions.map(rp => rp.permission.permission);
      res.status(StatusCodes.OK).json({
        success: true,
        permissions
      });
    } catch (err) {
      console.error('Error fetching role permissions:', err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to fetch role permissions',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  static async getUserPermissions(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      const user = await UserService.getUserById(userId);

      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'User not found'
        });
      }

      const userPermissions = await prisma.user.findUnique({
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

      const permissions = userPermissions?.role?.roleMappings.map(
        rp => rp.permission.permission
      ) || [];

      res.status(StatusCodes.OK).json({
        success: true,
        permissions
      });
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to fetch user permissions',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }
}
