import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response.js';
import { config } from '../config/env.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // If response has already sent headers, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 'Validation failed', 400, formattedErrors);
    return;
  }

  // 2. Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const fields = Object.keys(err.keyPattern || err.keyValue || {});
    const field = fields[0] || 'field';
    sendError(res, `An account or record with this ${field} already exists`, 409, [
      { field, message: `Duplicate ${field}` },
    ]);
    return;
  }

  // 3. Mongoose Validation Error
  if (err.name === 'ValidationError' && err.errors) {
    const formattedErrors = Object.keys(err.errors).map((key) => ({
      field: key,
      message: err.errors[key].message,
    }));
    sendError(res, 'Validation failed', 400, formattedErrors);
    return;
  }

  // 4. Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    sendError(res, `Resource not found with id: ${err.value}`, 404);
    return;
  }

  // 5. JWT Errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid authentication token', 401);
    return;
  }
  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Authentication token has expired', 401);
    return;
  }

  // 6. Generic / Internal Server Error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (config.nodeEnv !== 'test') {
    console.error('[Error Handler]', err);
  }

  sendError(
    res,
    config.nodeEnv === 'production' && statusCode === 500
      ? 'An unexpected server error occurred'
      : message,
    statusCode
  );
};

