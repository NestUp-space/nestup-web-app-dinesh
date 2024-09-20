import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth.service';  // Remove resetPassword from import

export const register = async (req: Request, res: Response) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({ user });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const token = await loginUser(req.body);
    res.status(200).json({ token });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Local resetPassword declaration to avoid conflicts
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await resetPassword(email, res);  // Pass both email and res to avoid the argument error
    res.status(200).json({ message: 'Password reset link sent to email' });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
