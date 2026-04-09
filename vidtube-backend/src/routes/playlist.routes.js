import { Router } from 'express';
import {
  createPlaylist,
  getCurrentUserPlaylists,
  getUserPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
} from '../controllers/playlist.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { playlistMutationLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

// ============================================
// PROTECTED ROUTES (must come before /:playlistId)
// ============================================

router.route('/').post(verifyJWT, playlistMutationLimiter, createPlaylist);
router.route('/user').get(verifyJWT, getCurrentUserPlaylists);

// ============================================
// PUBLIC ROUTES
// ============================================

router.route('/user/:userId').get(getUserPlaylists);
router.route('/:playlistId').get(getPlaylistById);

// ============================================
// PROTECTED ROUTES (specific operations)
// ============================================

router
  .route('/:playlistId')
  .patch(verifyJWT, playlistMutationLimiter, updatePlaylist)
  .delete(verifyJWT, playlistMutationLimiter, deletePlaylist);

router
  .route('/:playlistId/videos/:videoId')
  .post(verifyJWT, playlistMutationLimiter, addVideoToPlaylist)
  .delete(verifyJWT, playlistMutationLimiter, removeVideoFromPlaylist);

export default router;
