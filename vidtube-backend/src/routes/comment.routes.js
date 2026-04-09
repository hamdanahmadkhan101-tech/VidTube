import { Router } from 'express';
import { verifyJWT, optionalJWT } from '../middlewares/auth.middleware.js';
import {
  addComment,
  updateComment,
  deleteComment,
  getVideoComments,
  getCommentReplies,
} from '../controllers/comment.controller.js';

const router = Router();

// ============================================
// COMMENT ROUTES
// ============================================

router
  .route('/:videoId')
  .post(verifyJWT, addComment)
  .get(optionalJWT, getVideoComments);

router
  .route('/c/:commentId')
  .patch(verifyJWT, updateComment)
  .delete(verifyJWT, deleteComment);

router.route('/:commentId/replies').get(optionalJWT, getCommentReplies);

export default router;
