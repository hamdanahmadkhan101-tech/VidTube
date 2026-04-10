import { ValidationError } from '../errors/index.js';

/**
 * Validation Middleware
 * Validates request data against Zod schemas
 * Provides better TypeScript support and type inference
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataBySource = {
        body: req.body,
        query: req.query,
        params: req.params,
      };

      const data = dataBySource[source] || req.body;

      // Zod's parse method validates and returns typed data
      const result = schema.parse(data);

      // Store validated payload for optional downstream usage
      req.validated = req.validated || {};
      req.validated[source] = result;

      // Replace request data with validated and sanitized data
      if (source === 'query') {
        // Express 5 exposes req.query as a getter-only property.
        // Keep query immutable here and rely on req.validated.query when needed.
      } else if (source === 'params') {
        Object.assign(req.params, result);
      } else {
        req.body = result;
      }

      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error?.name === 'ZodError' || Array.isArray(error?.issues)) {
        const issues = error.issues || error.errors || [];
        const errors = issues.map((err) => ({
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
