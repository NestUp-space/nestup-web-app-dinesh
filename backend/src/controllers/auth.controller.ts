import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod'; // Import Zod
import { registerUser, loginUser, resetPassword as resetPasswordService } from '../services/auth.service'; // Import resetPassword service
import { ServiceResponse } from '@/common/models/serviceResponse'; // Import ServiceResponse if needed for type checking, though often inferred

// --- Zod Schemas for Input Validation ---
const RegisterBodySchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phoneNumber: z.string().regex(/^\d{10}$/, { message: 'Phone number must be 10 digits' }), // Basic 10-digit validation
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  roleName: z.string().default('client'), // Set default role to "client"
});

const LoginBodySchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

const EmailBodySchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});
// --- End Zod Schemas ---

export const register = async (req: Request, res: Response) => {
  // Validate request body
  const validationResult = RegisterBodySchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors: validationResult.error.errors, // Provide detailed validation errors
    });
  }

  // Proceed with validated data
  const serviceResponse = await registerUser(validationResult.data);

  if (serviceResponse.success) {
    // Successfully registered
    res.status(serviceResponse.statusCode).json({
      success: true,
      message: serviceResponse.message,
      user: serviceResponse.responseObject, // Contains user data without password
    });
  } else {
    // Registration failed
    res.status(serviceResponse.statusCode).json({
      success: false,
      message: serviceResponse.message,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  console.log('Login request received:', { body: req.body });
  
  // Validate request body
  const validationResult = LoginBodySchema.safeParse(req.body);
  if (!validationResult.success) {
    console.log('Login validation failed:', validationResult.error.errors);
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors: validationResult.error.errors,
    });
  }

  // Proceed with validated data
  const serviceResponse = await loginUser(validationResult.data);
  console.log('Login service response:', {
    success: serviceResponse.success,
    statusCode: serviceResponse.statusCode,
    message: serviceResponse.message,
    hasUser: serviceResponse.responseObject ? 'yes' : 'no'
  });

  // Check if serviceResponse is not null before accessing properties
  if (serviceResponse && serviceResponse.success && serviceResponse.responseObject) {
    // Successfully logged in
    const response = {
      success: true,
      message: serviceResponse.message,
      token: serviceResponse.responseObject.token,
      user: serviceResponse.responseObject.user
    };
    console.log('Sending successful login response');
    res.status(serviceResponse.statusCode).json(response);
  } else {
    // Login failed
    const response = {
      success: false,
      message: serviceResponse.message || 'Login failed'
    };
    console.log('Sending failed login response:', response);
    res.status(serviceResponse.statusCode).json(response);
  }
};

// Renamed to avoid conflict with the imported service function
export const handlePasswordResetRequest = async (req: Request, res: Response) => {
  // Validate request body
  const validationResult = EmailBodySchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors: validationResult.error.errors,
    });
  }

  const serviceResponse = await resetPasswordService(validationResult.data.email); // Call the imported service function with validated email

  // Send response based on service outcome
  res.status(serviceResponse.statusCode).json({
    success: serviceResponse.success,
    message: serviceResponse.message,
  });
};

// TODO: Add controller function for handling the actual password reset (e.g., verifying token and updating password)
