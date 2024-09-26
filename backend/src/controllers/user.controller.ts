import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  static async createUser(req: Request, res: Response) {
    try {
      const { email, password, role } = req.body;
      const newUser = await UserService.createUser({ email, password, role });
      res.status(201).json(newUser);
    } catch (err) {
      res.status(500).json({ error: 'Unable to create user' });
    }
  }

  static async getUsers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1; // Parse page number
      const pageSize = parseInt(req.query.pageSize as string) || 10; // Parse page size
      const users = await UserService.getUsers(page, pageSize);
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Unable to fetch users' });
    }
  }

  static async toggleUserActiveStatus(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      const updatedUser = await UserService.toggleUserActiveStatus(userId, isActive);
      res.json(updatedUser);
    } catch (err) {
      res.status(500).json({ error: 'Unable to update user status' });
    }
  }

  static async getUserById(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);
      const user = await UserService.getUserById(userId);
      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch user details' });
    }
  }
}
