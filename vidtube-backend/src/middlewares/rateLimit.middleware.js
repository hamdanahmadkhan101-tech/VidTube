import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse
 */

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP, please try again later',
    error: [{ field: 'rateLimit', message: 'Rate limit exceeded' }],
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts, please try again later',
    error: [{ field: 'rateLimit', message: 'Authentication rate limit exceeded' }],
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiter for video upload
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many upload requests, please try again later',
    error: [{ field: 'rateLimit', message: 'Upload rate limit exceeded' }],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for search endpoints
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 search requests per minute
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many search requests, please try again later',
    error: [{ field: 'rateLimit', message: 'Search rate limit exceeded' }],
  },
  standardHeaders: true,
  legacyHeaders: false,
});
