import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getUserById } from '../services/auth.service';

// Extend Request type to include user
export interface CustomRequest extends Request { // Added export
  user?: {
    id: number;
    role: string;
  };
}

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  const customReq = req as CustomRequest; // Cast to CustomRequest
  const token = customReq.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log('Auth Middleware: Decoded JWT payload:', decoded); // ADD THIS LINE
    console.log('Auth Middleware: ID from decoded payload:', decoded.id); // ADD THIS LINE
    const userResponse = await getUserById(decoded.id);

    if (!userResponse || !userResponse.success || !userResponse.responseObject) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    customReq.user = { // Use customReq
      id: userResponse.responseObject.id,
      role: userResponse.responseObject.role.role, // Extract the role name
    };
    console.log('Authenticated user role:', customReq.user?.role); // Debugging log, use customReq
    return next(); // Explicitly return after calling next()
  } catch (error) {
    // Pass the error to the Express error handling middleware
    // Also, log the error for debugging.
    console.error('Authentication error in middleware:', error);
    return next(error); // Let a dedicated error handler send the response
  }
};
