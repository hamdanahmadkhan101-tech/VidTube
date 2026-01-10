/**
 * Test App Configuration
 * Creates app instance with rate limiting disabled for testing
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import requestIdMiddleware from '../../middlewares/requestId.middleware.js';
import errorMiddleware from '../../middlewares/error.middleware.js';
import { securityMiddleware, securityHeaders } from '../../middlewares/security.middleware.js';
import userRoutes from '../../routes/user.routes.js';
import { requestLogger, errorLogger } from '../../middlewares/logger.middleware.js';
import videoRoutes from '../../routes/video.routes.js';
import likeRoutes from '../../routes/like.routes.js';
import commentRoutes from '../../routes/comment.routes.js';

const testApp = express();

// Request ID middleware
testApp.use(requestIdMiddleware);

// Security headers (simplified in test mode)
testApp.use(securityHeaders);
// Skip Helmet in test mode (causes issues with some tests)
if (process.env.NODE_ENV !== 'test') {
  testApp.use(securityMiddleware);
}

// Request logging (disabled in test to reduce noise)
// testApp.use(requestLogger);

// CORS for testing
testApp.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Body parsing
testApp.use(express.urlencoded({ extended: true, limit: '16kb' }));
testApp.use(express.json({ limit: '16kb' }));
testApp.use(cookieParser());

// Health check
testApp.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes (rate limiting is bypassed in test environment via middleware)
testApp.use('/api/v1/users', userRoutes);
testApp.use('/api/v1/videos', videoRoutes);
testApp.use('/api/v1/likes', likeRoutes);
testApp.use('/api/v1/comments', commentRoutes);

// Error logging (before error handler)
testApp.use(errorLogger);

// Error middleware (must be last)
testApp.use(errorMiddleware);

export default testApp;
