import { Request, Response, NextFunction } from 'express';

// Base error class for the application
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500);
  }
}

// Error factory functions
export const createValidationError = (message: string): ValidationError => {
  return new ValidationError(message);
};

export const createNotFoundError = (message?: string): NotFoundError => {
  return new NotFoundError(message);
};

export const createUnauthorizedError = (message?: string): UnauthorizedError => {
  return new UnauthorizedError(message);
};

export const createForbiddenError = (message?: string): ForbiddenError => {
  return new ForbiddenError(message);
};

export const createConflictError = (message?: string): ConflictError => {
  return new ConflictError(message);
};

export const createInternalServerError = (message?: string): InternalServerError => {
  return new InternalServerError(message);
};

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error response utility
export const sendErrorResponse = (res: Response, error: AppError) => {
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};
