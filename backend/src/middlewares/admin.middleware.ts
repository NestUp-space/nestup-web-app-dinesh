import { Response, NextFunction } from 'express';
import { CustomRequest } from './auth.middleware';

export const adminMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  console.log('User role:', req.user?.role); // Debugging log
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super admin')) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
};
