import { Router } from 'express';
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
} from '../controllers/playlist.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

router.route('/user/:userId').get(getUserPlaylists);
router.route('/:playlistId').get(getPlaylistById);

// ============================================
// PROTECTED ROUTES
// ============================================

router.route('/').post(verifyJWT, createPlaylist);
router.route('/user').get(verifyJWT, getUserPlaylists);

router
  .route('/:playlistId')
  .patch(verifyJWT, updatePlaylist)
  .delete(verifyJWT, deletePlaylist);

router
  .route('/:playlistId/videos/:videoId')
  .post(verifyJWT, addVideoToPlaylist)
  .delete(verifyJWT, removeVideoFromPlaylist);

export default router;
