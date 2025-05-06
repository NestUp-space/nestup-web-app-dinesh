import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { StatusCodes } from 'http-status-codes';

/**
 * Middleware to validate request body, query parameters, and route parameters against a Zod schema.
 * @param schema - The Zod schema to validate against.
 * @returns Express middleware function.
 */
export const validateRequest = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate the entire request object (body, query, params)
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Optionally, replace req parts with parsed data if transformations occurred
      // req.body = parsed.body;
      // req.query = parsed.query;
      // req.params = parsed.params;

      return next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        // Format Zod errors for a user-friendly response
        const errorMessages = error.errors.map((issue) => ({
          field: issue.path.join('.'), // e.g., "body.email"
          message: issue.message,
        }));
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Input validation failed',
          errors: errorMessages,
        });
        return; // Stop processing
      }
      // Forward non-Zod errors to the global error handler
      return next(error);
    }
  };
