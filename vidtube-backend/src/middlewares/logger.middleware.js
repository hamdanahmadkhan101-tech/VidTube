import { logInfo, logError, logWarn } from '../utils/logger.js';

/**
 * Request Logging Middleware
 * Logs all HTTP requests with relevant metadata
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  logInfo('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
  });

  // Override res.json to log response
  const originalJson = res.json.bind(res);
  res.json = function (data) {
    const duration = Date.now() - startTime;

    // Log response
    logInfo('Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });

    // Log slow requests as warnings
    if (duration > 1000) {
      logWarn('Slow request detected', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
      });
    }

    return originalJson(data);
  };

  next();
};

/**
 * Error Logging Middleware
 * Logs errors with full context
 */
export const errorLogger = (err, req, res, next) => {
  logError('Request error', err, {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  next(err);
};
