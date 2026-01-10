import { randomUUID } from 'crypto';

/**
 * Request ID Middleware
 * Generates a unique request ID for each request to aid in debugging and tracing
 */
const requestIdMiddleware = (req, res, next) => {
  // Generate or use existing request ID (useful for tracing across services)
  req.requestId = req.headers['x-request-id'] || randomUUID();
  
  // Add request ID to response headers for client-side tracking
  res.setHeader('X-Request-Id', req.requestId);
  
  next();
};

export default requestIdMiddleware;
