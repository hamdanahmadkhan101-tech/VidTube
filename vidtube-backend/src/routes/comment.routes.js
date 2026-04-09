import { Router } from 'express';
import { verifyJWT, optionalJWT } from '../middlewares/auth.middleware.js';
import {
  addComment,
  updateComment,
  deleteComment,
  getVideoComments,
  getCommentReplies,
} from '../controllers/comment.controller.js';
import {
  cacheResponse,
  invalidateCacheOnSuccess,
} from '../middlewares/cache.middleware.js';
import { commentMutationLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

const invalidateCommentReadCache = invalidateCacheOnSuccess({
  namespaces: [
    'comments:video',
    'comments:replies',
    'videos:list',
    'videos:search',
  ],
});

// ============================================
// COMMENT ROUTES
// ============================================

router
  .route('/:videoId')
  .post(
    verifyJWT,
    commentMutationLimiter,
    invalidateCommentReadCache,
    addComment
  )
  .get(
    optionalJWT,
    cacheResponse({
      namespace: 'comments:video',
      ttlSeconds: 30,
      skip: (req) => Boolean(req.user?._id),
      keyBuilder: (req) => ({
        videoId: req.params.videoId,
        query: req.query,
      }),
    }),
    getVideoComments
  );

router
  .route('/c/:commentId')
  .patch(
    verifyJWT,
    commentMutationLimiter,
    invalidateCommentReadCache,
    updateComment
  )
  .delete(
    verifyJWT,
    commentMutationLimiter,
    invalidateCommentReadCache,
    deleteComment
  );

router.route('/:commentId/replies').get(
  optionalJWT,
  cacheResponse({
    namespace: 'comments:replies',
    ttlSeconds: 30,
    skip: (req) => Boolean(req.user?._id),
    keyBuilder: (req) => ({
      commentId: req.params.commentId,
      query: req.query,
    }),
  }),
  getCommentReplies
);

export default router;
