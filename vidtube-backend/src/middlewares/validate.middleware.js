import { ValidationError } from '../errors/index.js';

/**
 * Validation Middleware
 * Validates request data against Zod schemas
 * Provides better TypeScript support and type inference
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = source === 'query' ? req.query : req.body;

      // Zod's parse method validates and returns typed data
      const result = schema.parse(data);

      // Replace request data with validated and sanitized data
      if (source === 'query') {
        req.query = result;
      } else {
        req.body = result;
      }

      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return next(new ValidationError('Validation failed', errors));
      }

      // Handle unexpected errors
      return next(error);
    }
  };
};
