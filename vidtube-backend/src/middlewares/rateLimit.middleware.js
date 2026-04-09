import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { sendRedisCommand } from '../services/cache.service.js';

/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse
 */

const RATE_LIMIT_REDIS_ENABLED =
  process.env.RATE_LIMIT_REDIS_ENABLED !== 'false';
const RATE_LIMIT_PREFIX =
  process.env.RATE_LIMIT_PREFIX ||
  `${process.env.CACHE_PREFIX || 'vidtube'}:ratelimit:`;

const createLimiter = ({
  key,
  windowMs,
  max,
  message,
  errorMessage,
  skipSuccessfulRequests = false,
}) => {
  const useRedisStore =
    RATE_LIMIT_REDIS_ENABLED && Boolean(process.env.REDIS_URL);

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      statusCode: 429,
      message,
      error: [{ field: 'rateLimit', message: errorMessage || message }],
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    // Keep API available if Redis is temporarily unavailable.
    passOnStoreError: true,
    ...(useRedisStore
      ? {
          store: new RedisStore({
            sendCommand: (...args) => sendRedisCommand(...args),
            prefix: `${RATE_LIMIT_PREFIX}${key}:`,
          }),
        }
      : {}),
  });
};

// General API rate limiter
export const apiLimiter = createLimiter({
  key: 'api',
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Too many requests from this IP, please try again later',
  errorMessage: 'Rate limit exceeded',
});

// Strict rate limiter for authentication endpoints
export const authLimiter = createLimiter({
  key: 'auth',
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later',
  errorMessage: 'Authentication rate limit exceeded',
  skipSuccessfulRequests: true,
});

// Rate limiter for video upload
export const uploadLimiter = createLimiter({
  key: 'upload',
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many upload requests, please try again later',
  errorMessage: 'Upload rate limit exceeded',
});

// Rate limiter for search endpoints
export const searchLimiter = createLimiter({
  key: 'search',
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'Too many search requests, please try again later',
  errorMessage: 'Search rate limit exceeded',
});

// Public username/email availability checks
export const availabilityLimiter = createLimiter({
  key: 'availability',
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'Too many availability checks, please try again shortly',
  errorMessage: 'Availability check rate limit exceeded',
});

// User profile/account modifications
export const profileMutationLimiter = createLimiter({
  key: 'profile-mutation',
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: 'Too many profile updates, please try again later',
  errorMessage: 'Profile update rate limit exceeded',
});

// Subscription toggle protection
export const subscriptionLimiter = createLimiter({
  key: 'subscription-toggle',
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'Too many subscription actions, please try again later',
  errorMessage: 'Subscription action rate limit exceeded',
});

// Owner-only video management mutations
export const videoMutationLimiter = createLimiter({
  key: 'video-mutation',
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: 'Too many video management actions, please try again later',
  errorMessage: 'Video mutation rate limit exceeded',
});

// Watch events can spike quickly
export const watchHistoryLimiter = createLimiter({
  key: 'video-watch',
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: 'Too many watch events, please slow down',
  errorMessage: 'Watch event rate limit exceeded',
});

// Comment create/edit/delete bursts
export const commentMutationLimiter = createLimiter({
  key: 'comment-mutation',
  windowMs: 1 * 60 * 1000,
  max: 45,
  message: 'Too many comment actions, please try again shortly',
  errorMessage: 'Comment action rate limit exceeded',
});

// Like/unlike bursts
export const likeMutationLimiter = createLimiter({
  key: 'like-mutation',
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: 'Too many like actions, please try again shortly',
  errorMessage: 'Like action rate limit exceeded',
});

// Notification reads and polling-like paths
export const notificationReadLimiter = createLimiter({
  key: 'notification-read',
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: 'Too many notification fetch requests, please try again shortly',
  errorMessage: 'Notification read rate limit exceeded',
});

// Notification mutation paths
export const notificationMutationLimiter = createLimiter({
  key: 'notification-mutation',
  windowMs: 1 * 60 * 1000,
  max: 80,
  message: 'Too many notification update requests, please try again later',
  errorMessage: 'Notification mutation rate limit exceeded',
});

// Playlist management actions
export const playlistMutationLimiter = createLimiter({
  key: 'playlist-mutation',
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: 'Too many playlist actions, please try again later',
  errorMessage: 'Playlist mutation rate limit exceeded',
});

// Report submission protection
export const reportCreateLimiter = createLimiter({
  key: 'report-create',
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many reports submitted, please try again later',
  errorMessage: 'Report submission rate limit exceeded',
});

// Admin moderation paths should still have sane bounds
export const adminModerationLimiter = createLimiter({
  key: 'admin-moderation',
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many moderation requests, please try again later',
  errorMessage: 'Moderation rate limit exceeded',
});
