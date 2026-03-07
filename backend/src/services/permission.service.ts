import { ServiceResponse } from '../common/models/serviceResponse';
import { StatusCodes } from 'http-status-codes';

import prisma from '../config/db';
export interface Permission {
  id: number;
  permission: string;
}

export class PermissionService {
  static async getAllPermissions(): Promise<ServiceResponse<Permission[]>> {
    try {
      const permissions = await prisma.userPermission.findMany({
        select: {
          id: true,
          permission: true,
        },
        orderBy: {
          permission: 'asc',
        },
      });
      return ServiceResponse.success('Permissions retrieved successfully', permissions, StatusCodes.OK);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return ServiceResponse.failure('Failed to fetch permissions', [], StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
