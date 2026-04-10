import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  toggleVideoLike,
  toggleCommentLike,
  getLikedVideos,
} from '../controllers/like.controller.js';
import { invalidateCacheOnSuccess } from '../middlewares/cache.middleware.js';
import { likeMutationLimiter } from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  buildObjectIdParamSchema,
  paginationQuerySchema,
} from '../validators/common.validator.js';

const router = Router();

const invalidateVideoDiscoveryCache = invalidateCacheOnSuccess({
  namespaces: ['videos:list', 'videos:search'],
});

const invalidateCommentReadCache = invalidateCacheOnSuccess({
  namespaces: ['comments:video', 'comments:replies'],
});

// ============================================
// PROTECTED ROUTES
// ============================================

router
  .route('/toggle/v/:videoId')
  .post(
    verifyJWT,
    likeMutationLimiter,
    validate(buildObjectIdParamSchema('videoId'), 'params'),
    invalidateVideoDiscoveryCache,
    toggleVideoLike
  );
router
  .route('/toggle/c/:commentId')
  .post(
    verifyJWT,
    likeMutationLimiter,
    validate(buildObjectIdParamSchema('commentId'), 'params'),
    invalidateCommentReadCache,
    toggleCommentLike
  );
router
  .route('/videos')
  .get(verifyJWT, validate(paginationQuerySchema, 'query'), getLikedVideos);

export default router;
