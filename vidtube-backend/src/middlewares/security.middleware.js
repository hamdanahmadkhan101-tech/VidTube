import helmet from 'helmet';

/**
 * Security Middleware Configuration
 * Sets various HTTP headers to help protect the app from well-known web vulnerabilities
 */

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'], // Allow images from any source for video thumbnails
      mediaSrc: ["'self'", 'https:', 'http:'], // Allow media from any source for videos
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for video playback
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin resources for video hosting
});

// Additional security headers
export const securityHeaders = (req, res, next) => {
  // HSTS header (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');

  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
};
