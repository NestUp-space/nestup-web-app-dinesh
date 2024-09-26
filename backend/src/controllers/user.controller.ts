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
      const { page = 1, pageSize = 10 } = req.query;
      const users = await UserService.getUsers(Number(page), Number(pageSize));
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
}
