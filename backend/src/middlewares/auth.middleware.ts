import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getUserById } from '../services/auth.service';

// Extend Request type to include user
interface CustomRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export const isAuthenticated = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = {
      id: user.id,
      role: user.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
};
