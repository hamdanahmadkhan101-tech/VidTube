import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  addComment,
  updateComment,
  deleteComment,
  getVideoComments,
} from '../controllers/comment.controller.js';

const router = Router();

// ============================================
// COMMENT ROUTES
// ============================================

router
  .route('/:videoId')
  .post(verifyJWT, addComment)
  .get(getVideoComments);

router
  .route('/c/:commentId')
  .patch(verifyJWT, updateComment)
  .delete(verifyJWT, deleteComment);

export default router;


