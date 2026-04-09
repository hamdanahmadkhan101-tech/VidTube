import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  toggleVideoLike,
  toggleCommentLike,
  getLikedVideos,
} from '../controllers/like.controller.js';
import { invalidateCacheOnSuccess } from '../middlewares/cache.middleware.js';
import { likeMutationLimiter } from '../middlewares/rateLimit.middleware.js';

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
    invalidateVideoDiscoveryCache,
    toggleVideoLike
  );
router
  .route('/toggle/c/:commentId')
  .post(
    verifyJWT,
    likeMutationLimiter,
    invalidateCommentReadCache,
    toggleCommentLike
  );
router.route('/videos').get(verifyJWT, getLikedVideos);

export default router;
