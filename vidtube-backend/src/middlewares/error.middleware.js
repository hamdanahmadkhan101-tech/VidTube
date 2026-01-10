import apiError from '../utils/apiError.js';
import { ValidationError } from '../errors/index.js';
import { logError } from '../utils/logger.js';

/**
 * Global Error Handling Middleware
 * Catches all errors and sends standardized error responses
 */
const errorMiddleware = (err, req, res, next) => {
  // Get request ID for error tracking
  const requestId = req.requestId || 'unknown';

  // Handle known API errors
  if (err instanceof apiError) {
    const response = {
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      error: err.error || null,
      data: null,
      requestId,
    };

    // Include stack trace in development mode
    if (process.env.NODE_ENV === 'development') {
      response.stack = err.stack;
      response.name = err.name;
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle MongoDB/Mongoose validation errors
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Validation failed',
      error: validationErrors,
      data: null,
      requestId,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        name: err.name,
      }),
    });
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      statusCode: 409,
      message: `${field} already exists`,
      error: [{ field, message: `${field} must be unique` }],
      data: null,
      requestId,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        name: err.name,
      }),
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Invalid token',
      error: null,
      data: null,
      requestId,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        name: err.name,
      }),
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Token expired',
      error: null,
      data: null,
      requestId,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        name: err.name,
      }),
    });
  }

  // Handle Multer file upload errors
  if (err.name === 'MulterError') {
    let message = 'File upload error';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size too large';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    }

    return res.status(400).json({
      success: false,
      statusCode: 400,
      message,
      error: [{ field: 'file', message: err.message }],
      data: null,
      requestId,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        name: err.name,
        code: err.code,
      }),
    });
  }

  // Log unexpected errors (using logger utility)
  logError('Unexpected error', err, {
    requestId,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
  });

  // Send generic error response for unexpected errors
  return res.status(500).json({
    success: false,
    statusCode: 500,
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Internal server error. Please try again later.',
    error: null,
    data: null,
    requestId,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      name: err.name,
    }),
  });
};

export default errorMiddleware;
