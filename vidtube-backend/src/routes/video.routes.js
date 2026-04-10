import { Router } from 'express';
import {
  // Core Video Management
  uploadVideo,
  getAllVideos,
  getVideoById,

  // Video Management
  updateVideo,
  deleteVideo,
  togglePublishStatus,

  // Video Discovery
  searchVideos,
  getSearchSuggestions,
  getVideosByOwner,

  // Video Interactions
  addVideoToWatchHistory,
} from '../controllers/video.controller.js';
import {
  uploadVideo as uploadVideoMiddleware,
  uploadImage,
} from '../middlewares/multer.middleware.js';
import { verifyJWT, optionalJWT } from '../middlewares/auth.middleware.js';
import {
  uploadLimiter,
  searchLimiter,
  videoMutationLimiter,
  watchHistoryLimiter,
} from '../middlewares/rateLimit.middleware.js';
import {
  cacheResponse,
  invalidateCacheOnSuccess,
} from '../middlewares/cache.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  videoUploadSchema,
  videoUpdateSchema,
  videoSearchSchema,
  videoSuggestionsSchema,
  videoListQuerySchema,
} from '../validators/video.validator.js';
import { buildObjectIdParamSchema } from '../validators/common.validator.js';

const router = Router();

const invalidateVideoDiscoveryCache = invalidateCacheOnSuccess({
  namespaces: ['videos:list', 'videos:search', 'videos:suggestions'],
});

// ============================================
// PUBLIC ROUTES (with optional auth for like/subscribe status)
// ============================================

router
  .route('/')
  .get(
    optionalJWT,
    validate(videoListQuerySchema, 'query'),
    cacheResponse({ namespace: 'videos:list', ttlSeconds: 60 }),
    getAllVideos
  );
router
  .route('/search')
  .get(
    searchLimiter,
    optionalJWT,
    validate(videoSearchSchema, 'query'),
    cacheResponse({ namespace: 'videos:search', ttlSeconds: 45 }),
    searchVideos
  );
router
  .route('/suggestions')
  .get(
    searchLimiter,
    validate(videoSuggestionsSchema, 'query'),
    cacheResponse({ namespace: 'videos:suggestions', ttlSeconds: 300 }),
    getSearchSuggestions
  );
router
  .route('/user/:userId')
  .get(
    optionalJWT,
    validate(buildObjectIdParamSchema('userId'), 'params'),
    getVideosByOwner
  );
router
  .route('/:videoId')
  .get(
    optionalJWT,
    validate(buildObjectIdParamSchema('videoId'), 'params'),
    getVideoById
  );

// ============================================
// PROTECTED ROUTES
// ============================================

router.route('/upload').post(
  uploadLimiter,
  verifyJWT,
  uploadVideoMiddleware.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  validate(videoUploadSchema),
  invalidateVideoDiscoveryCache,
  uploadVideo
);

router
  .route('/toggle/publish/:videoId')
  .patch(
    verifyJWT,
    videoMutationLimiter,
    validate(buildObjectIdParamSchema('videoId'), 'params'),
    invalidateVideoDiscoveryCache,
    togglePublishStatus
  );

router
  .route('/:videoId')
  .patch(
    verifyJWT,
    videoMutationLimiter,
    validate(buildObjectIdParamSchema('videoId'), 'params'),
    uploadImage.fields([{ name: 'thumbnail', maxCount: 1 }]),
    validate(videoUpdateSchema),
    invalidateVideoDiscoveryCache,
    updateVideo
  )
  .delete(
    verifyJWT,
    videoMutationLimiter,
    validate(buildObjectIdParamSchema('videoId'), 'params'),
    invalidateVideoDiscoveryCache,
    deleteVideo
  );

router
  .route('/:videoId/watch')
  .post(
    verifyJWT,
    watchHistoryLimiter,
    validate(buildObjectIdParamSchema('videoId'), 'params'),
    addVideoToWatchHistory
  );

export default router;
