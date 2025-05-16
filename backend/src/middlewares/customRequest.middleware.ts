import { Request, Response, NextFunction } from 'express';
import { CustomRequest } from './auth.middleware';

export const ensureCustomRequest = (
  handler: (req: CustomRequest, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return handler(req as CustomRequest, res, next);
  };
};
