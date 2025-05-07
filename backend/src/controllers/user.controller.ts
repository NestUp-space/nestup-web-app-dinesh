import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { StatusCodes } from 'http-status-codes';

// Extend Request type to include user
interface CustomRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export class UserController {
  static async createUser(req: Request, res: Response) {
    try {
      const { email, password, name, phoneNumber, roleId } = req.body;
      const newUser = await UserService.createUser({ email, password, name, phoneNumber, roleId });
      res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'User created successfully',
        user: newUser
      });
    } catch (err) {
      console.error('Error creating user:', err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to create user',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  static async getUsers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1; // Parse page number
      const pageSize = parseInt(req.query.pageSize as string) || 10; // Parse page size
      const users = await UserService.getUsers(page, pageSize);
      res.status(StatusCodes.OK).json({
        success: true,
        data: users
      });
    } catch (err) {
      console.error('Error fetching users:', err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to fetch users',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  static async toggleUserActiveStatus(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      const updatedUser = await UserService.toggleUserActiveStatus(userId, isActive);
      res.status(StatusCodes.OK).json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        user: updatedUser
      });
    } catch (err) {
      console.error('Error toggling user status:', err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Unable to update user status',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  static async getUserById(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);
      const user = await UserService.getUserById(userId);
      if (user) {
        res.status(StatusCodes.OK).json({
          success: true,
          user
        });
      } else {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'User not found'
        });
      }
    } catch (err) {
      console.error('Error fetching user by ID:', err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch user details',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }
  
  static async getCurrentUserProfile(req: CustomRequest, res: Response) {
    try {
      // Get the user ID from the authenticated request
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      const serviceResponse = await UserService.getCurrentUserProfile(userId);
      
      return res.status(serviceResponse.statusCode).json({
        success: serviceResponse.success,
        message: serviceResponse.message,
        user: serviceResponse.responseObject
      });
    } catch (err) {
      console.error('Error fetching current user profile:', err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch user profile',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }
}
