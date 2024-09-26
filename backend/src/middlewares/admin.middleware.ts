import { Request, Response, NextFunction } from 'express';

interface CustomRequest extends Request {
  user?: {
    role: string;
  };
}

export const adminMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
};
