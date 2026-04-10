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
import { validate } from '../middlewares/validate.middleware.js';
import { preventDuplicateCommentSpam } from '../middlewares/antiSpam.middleware.js';
import {
  createCommentSchema,
  updateCommentSchema,
  commentListQuerySchema,
  commentRepliesQuerySchema,
} from '../validators/comment.validator.js';
import { buildObjectIdParamSchema } from '../validators/common.validator.js';

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
    validate(buildObjectIdParamSchema('videoId'), 'params'),
    validate(createCommentSchema),
    preventDuplicateCommentSpam({ windowSeconds: 30 }),
    invalidateCommentReadCache,
    addComment
  )
  .get(
    optionalJWT,
    validate(buildObjectIdParamSchema('videoId'), 'params'),
    validate(commentListQuerySchema, 'query'),
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
    validate(buildObjectIdParamSchema('commentId'), 'params'),
    validate(updateCommentSchema),
    invalidateCommentReadCache,
    updateComment
  )
  .delete(
    verifyJWT,
    commentMutationLimiter,
    validate(buildObjectIdParamSchema('commentId'), 'params'),
    invalidateCommentReadCache,
    deleteComment
  );

router.route('/:commentId/replies').get(
  optionalJWT,
  validate(buildObjectIdParamSchema('commentId'), 'params'),
  validate(commentRepliesQuerySchema, 'query'),
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
