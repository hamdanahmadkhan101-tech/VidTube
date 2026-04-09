import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import requestIdMiddleware from './middlewares/requestId.middleware.js';
import errorMiddleware from './middlewares/error.middleware.js';
import {
  securityMiddleware,
  securityHeaders,
} from './middlewares/security.middleware.js';
import { apiLimiter } from './middlewares/rateLimit.middleware.js';
import { requestLogger, errorLogger } from './middlewares/logger.middleware.js';
import userRoutes from './routes/user.routes.js';
import videoRoutes from './routes/video.routes.js';
import likeRoutes from './routes/like.routes.js';
import commentRoutes from './routes/comment.routes.js';
import playlistRoutes from './routes/playlist.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import reportRoutes from './routes/report.routes.js';
import { getAllowedOrigins } from './config/cors.config.js';
import { getSocketDiagnostics } from './socket/socket.server.js';
import { getCacheDiagnostics } from './services/cache.service.js';

const app = express();

// If behind a reverse proxy/CDN (Railway/Render/Nginx), trust proxy for
// correct IPs and secure cookie/HTTPS detection
app.set('trust proxy', 1);

// CORS Configuration - centralized in config and env-driven for production
const allowedOrigins = getAllowedOrigins();

// Security: Request ID for tracing (must be first)
app.use(requestIdMiddleware);

// CORS Configuration (MUST be before security middleware and rate limiting)
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  })
);

// Security headers (after CORS)
app.use(securityMiddleware);
app.use(securityHeaders);

// Apply general API rate limiting (after CORS)
app.use('/api/', apiLimiter);

// Increase timeout for upload routes
app.use('/api/v1/videos/upload', (req, res, next) => {
  req.setTimeout(600000); // 10 minutes
  res.setTimeout(600000); // 10 minutes
  next();
});

// Request logging (after security middleware)
app.use(requestLogger);

// Body parsing middleware
const bodySizeLimit = process.env.BODY_SIZE_LIMIT || '1mb';
app.use(express.urlencoded({ extended: true, limit: bodySizeLimit }));
app.use(express.json({ limit: bodySizeLimit }));
app.use(express.static('public'));
app.use(cookieParser());

// ============================================
// HEALTH CHECK & METRICS (for deployment monitoring)
// ============================================
const authorizeMetricsRequest = (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  const metricsToken = process.env.METRICS_TOKEN;
  const providedToken = req.get('x-metrics-token');

  if (!metricsToken || !providedToken || providedToken !== metricsToken) {
    res.status(403).json({
      success: false,
      statusCode: 403,
      message: 'Forbidden',
      data: null,
      requestId: req.requestId,
    });
    return false;
  }

  return true;
};

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Service is healthy',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    },
    requestId: req.requestId,
  });
});

// Basic metrics endpoint (expand in Phase 1.5)
app.get('/metrics', (req, res) => {
  if (!authorizeMetricsRequest(req, res)) {
    return;
  }

  const memoryUsage = process.memoryUsage();
  const realtime = getSocketDiagnostics();
  const cache = getCacheDiagnostics();

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Metrics retrieved successfully',
    data: {
      uptime: process.uptime(),
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      realtime,
      cache,
    },
    requestId: req.requestId,
  });
});

// Focused realtime diagnostics endpoint for notification/socket delivery health.
app.get('/metrics/realtime', (req, res) => {
  if (!authorizeMetricsRequest(req, res)) {
    return;
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Realtime metrics retrieved successfully',
    data: getSocketDiagnostics(),
    requestId: req.requestId,
  });
});

app.get('/metrics/cache', (req, res) => {
  if (!authorizeMetricsRequest(req, res)) {
    return;
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Cache metrics retrieved successfully',
    data: getCacheDiagnostics(),
    requestId: req.requestId,
  });
});

// Development-only diagnostic route for integration checks
if (
  process.env.NODE_ENV !== 'production' ||
  process.env.ENABLE_DEBUG_ROUTES === 'true'
) {
  app.get('/test-cloudinary', (req, res) => {
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Cloudinary configuration status',
      data: {
        cloudNameConfigured: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
        apiKeyConfigured: Boolean(process.env.CLOUDINARY_API_KEY),
        apiSecretConfigured: Boolean(process.env.CLOUDINARY_API_SECRET),
      },
      requestId: req.requestId,
    });
  });
}

// ============================================
// ROUTES
// ============================================

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1/likes', likeRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/playlists', playlistRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/reports', reportRoutes);

// Error logging middleware (before error handler)
app.use(errorLogger);

// Error middleware must be LAST
app.use(errorMiddleware);

export default app;
