import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod'; // Import Zod
import { registerUser, loginUser, resetPassword as resetPasswordService } from '../services/auth.service';
import { EXTERNAL_ROLES } from '../constants/roles'; // Import EXTERNAL_ROLES

// --- Zod Schemas for Input Validation ---
const RegisterBodySchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phoneNumber: z.string().regex(/^\d{10}$/, { message: 'Phone number must be 10 digits' }), // Basic 10-digit validation
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  roleName: z.enum(
    // Ensure EXTERNAL_ROLES is not empty for z.enum
    Object.values(EXTERNAL_ROLES).length > 0
      ? Object.values(EXTERNAL_ROLES) as [string, ...string[]]
      : ['INVALID_EMPTY_ROLES_CONFIG'] as [string, ...string[]], // Fallback for empty config
    {
      required_error: "Role is required",
      invalid_type_error: "Invalid role selected. Must be one of: " + Object.values(EXTERNAL_ROLES).join(', '),
    }
  ),
});

const LoginBodySchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

const EmailBodySchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});
// --- End Zod Schemas ---

export const register = async (req: Request, res: Response): Promise<Response> => {
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
    return res.status(serviceResponse.statusCode).json({
      success: true,
      message: serviceResponse.message,
      user: serviceResponse.responseObject, // Contains user data without password
    });
  }
  
  // Registration failed
  return res.status(serviceResponse.statusCode).json({
    success: false,
    message: serviceResponse.message,
  });
};

export const login = async (req: Request, res: Response): Promise<Response> => {
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
    return res.status(serviceResponse.statusCode).json(response);
  }
  
  // Login failed
  const response = {
    success: false,
    message: serviceResponse.message || 'Login failed'
  };
  console.log('Sending failed login response:', response);
  return res.status(serviceResponse.statusCode).json(response);
};

// Renamed to avoid conflict with the imported service function
export const handlePasswordResetRequest = async (req: Request, res: Response): Promise<Response> => {
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
  return res.status(serviceResponse.statusCode).json({
    success: serviceResponse.success,
    message: serviceResponse.message,
  });
};

// TODO: Add controller function for handling the actual password reset (e.g., verifying token and updating password)
