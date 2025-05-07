import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

const prisma = new PrismaClient();

export class RoleController {
  static async createRole(req: Request, res: Response) {
    try {
      const { name, permissions } = req.body;

      if (!name) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Role name is required'
        });
      }

      // Check if role already exists
      const existingRole = await prisma.userRole.findFirst({
        where: { role: name }
      });

      if (existingRole) {
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: 'Role already exists'
        });
      }

      // Create the new role
      const newRole = await prisma.userRole.create({
        data: {
          role: name,
          roleType: name.toLowerCase()
        }
      });

      // Create permission mappings if permissions are provided
      if (permissions) {
        // For each permission, create a mapping
        for (const permKey in permissions) {
          if (permissions[permKey]) {
            // Find or create the permission
            let permission = await prisma.userPermission.findFirst({
              where: { permission: permKey }
            });

            if (!permission) {
              permission = await prisma.userPermission.create({
                data: { permission: permKey }
              });
            }

            // Create the mapping
            await prisma.rolePermissionMapping.create({
              data: {
                roleId: newRole.id,
                permissionId: permission.id
              }
            });
          }
        }
      }

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Role created successfully',
        role: newRole
      });
    } catch (err) {
      console.error('Error creating role:', err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to create role',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  static async getRoles(req: Request, res: Response) {
    try {
      const roles = await prisma.userRole.findMany({
        select: {
          id: true,
          role: true,
          roleType: true,
          roleMappings: {
            select: {
              permission: {
                select: {
                  permission: true
                }
              }
            }
          }
        }
      });

      // Transform roles to include permissions
      const transformedRoles = roles.map(role => ({
        id: role.id,
        name: role.role,
        type: role.roleType,
        permissions: role.roleMappings.reduce((acc, mapping) => {
          acc[mapping.permission.permission] = true;
          return acc;
        }, {} as Record<string, boolean>)
      }));

      res.status(StatusCodes.OK).json({
        success: true,
        roles: transformedRoles
      });
    } catch (err) {
      console.error('Error fetching roles:', err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to fetch roles',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  static async getRoleById(req: Request, res: Response) {
    try {
      const roleId = Number(req.params.id);
      const role = await prisma.userRole.findUnique({
        where: { id: roleId },
        select: {
          id: true,
          role: true,
          roleType: true,
          roleMappings: {
            select: {
              permission: {
                select: {
                  permission: true
                }
              }
            }
          }
        }
      });

      if (!role) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Transform permissions to a more usable format
      const permissions = role.roleMappings.reduce((acc, mapping) => {
        acc[mapping.permission.permission] = true;
        return acc;
      }, {} as Record<string, boolean>);

      res.status(StatusCodes.OK).json({
        success: true,
        role: {
          id: role.id,
          name: role.role,
          type: role.roleType,
          permissions
        }
      });
    } catch (err) {
      console.error('Error fetching role by ID:', err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch role details',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  static async updateRole(req: Request, res: Response) {
    try {
      const roleId = Number(req.params.id);
      const { name, permissions } = req.body;

      // Check if role exists
      const existingRole = await prisma.userRole.findUnique({
        where: { id: roleId }
      });

      if (!existingRole) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Prevent updating superadmin role
      if (existingRole.roleType === 'superadmin') {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: 'Superadmin role cannot be modified'
        });
      }

      // Update the role name
      const updatedRole = await prisma.userRole.update({
        where: { id: roleId },
        data: {
          role: name || existingRole.role
        },
        select: {
          id: true,
          role: true,
          roleType: true
        }
      });

      // If permissions are provided, update them
      if (permissions) {
        // First, delete all existing permission mappings
        await prisma.rolePermissionMapping.deleteMany({
          where: { roleId }
        });

        // Then create new mappings
        for (const permKey in permissions) {
          if (permissions[permKey]) {
            // Find or create the permission
            let permission = await prisma.userPermission.findFirst({
              where: { permission: permKey }
            });

            if (!permission) {
              permission = await prisma.userPermission.create({
                data: { permission: permKey }
              });
            }

            // Create the mapping
            await prisma.rolePermissionMapping.create({
              data: {
                roleId,
                permissionId: permission.id
              }
            });
          }
        }
      }

      // Get updated permissions
      const roleMappings = await prisma.rolePermissionMapping.findMany({
        where: { roleId },
        select: {
          permission: {
            select: {
              permission: true
            }
          }
        }
      });

      const updatedPermissions = roleMappings.reduce((acc, mapping) => {
        acc[mapping.permission.permission] = true;
        return acc;
      }, {} as Record<string, boolean>);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Role updated successfully',
        role: {
          id: updatedRole.id,
          name: updatedRole.role,
          type: updatedRole.roleType,
          permissions: updatedPermissions
        }
      });
    } catch (err) {
      console.error('Error updating role:', err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to update role',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  static async deleteRole(req: Request, res: Response) {
    try {
      const roleId = Number(req.params.id);

      // Check if role exists
      const existingRole = await prisma.userRole.findUnique({
        where: { id: roleId }
      });

      if (!existingRole) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Prevent deleting superadmin role
      if (existingRole.roleType === 'superadmin') {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: 'Superadmin role cannot be deleted'
        });
      }

      // Check if any users are assigned to this role
      const usersWithRole = await prisma.user.count({
        where: { roleId }
      });

      if (usersWithRole > 0) {
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: 'Cannot delete role as it is assigned to users'
        });
      }

      // Delete the role
      await prisma.userRole.delete({
        where: { id: roleId }
      });

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (err) {
      console.error('Error deleting role:', err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to delete role',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }
}
