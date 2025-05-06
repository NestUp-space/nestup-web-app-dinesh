import { StatusCodes } from 'http-status-codes';

/**
 * @class AppError
 * @extends Error
 * @description Base class for custom application errors.
 * @param {string} message - Error message.
 * @param {StatusCodes} statusCode - HTTP status code.
 * @param {boolean} isOperational - Whether the error is operational (expected).
 * @param {any[]} [errors] - Optional array of detailed error information.
 */
export class AppError extends Error {
  public readonly statusCode: StatusCodes;
  public readonly isOperational: boolean;
  public readonly errors?: any[];

  constructor(message: string, statusCode: StatusCodes, isOperational: boolean = true, errors?: any[]) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * @class BadRequestError
 * @extends AppError
 * @description Represents a 400 Bad Request error.
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', errors?: any[]) {
    super(message, StatusCodes.BAD_REQUEST, true, errors);
  }
}

/**
 * @class NotFoundError
 * @extends AppError
 * @description Represents a 404 Not Found error.
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, StatusCodes.NOT_FOUND);
  }
}

/**
 * @class UnauthorizedError
 * @extends AppError
 * @description Represents a 401 Unauthorized error.
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

/**
 * @class ForbiddenError
 * @extends AppError
 * @description Represents a 403 Forbidden error.
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, StatusCodes.FORBIDDEN);
  }
}

// You can add more specific error classes as needed (e.g., DatabaseError, ValidationError)
