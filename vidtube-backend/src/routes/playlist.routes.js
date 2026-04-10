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
import { validate } from '../middlewares/validate.middleware.js';
import { paginationQuerySchema } from '../validators/common.validator.js';
import {
  userIdParamSchema,
  playlistIdParamSchema,
  playlistVideoParamsSchema,
  createPlaylistSchema,
  updatePlaylistSchema,
} from '../validators/playlist.validator.js';

const router = Router();

// ============================================
// PROTECTED ROUTES (must come before /:playlistId)
// ============================================

router
  .route('/')
  .post(
    verifyJWT,
    playlistMutationLimiter,
    validate(createPlaylistSchema),
    createPlaylist
  );
router.route('/user').get(verifyJWT, getCurrentUserPlaylists);

// ============================================
// PUBLIC ROUTES
// ============================================

router
  .route('/user/:userId')
  .get(
    validate(userIdParamSchema, 'params'),
    validate(paginationQuerySchema, 'query'),
    getUserPlaylists
  );
router
  .route('/:playlistId')
  .get(validate(playlistIdParamSchema, 'params'), getPlaylistById);

// ============================================
// PROTECTED ROUTES (specific operations)
// ============================================

router
  .route('/:playlistId')
  .patch(
    verifyJWT,
    playlistMutationLimiter,
    validate(playlistIdParamSchema, 'params'),
    validate(updatePlaylistSchema),
    updatePlaylist
  )
  .delete(
    verifyJWT,
    playlistMutationLimiter,
    validate(playlistIdParamSchema, 'params'),
    deletePlaylist
  );

router
  .route('/:playlistId/videos/:videoId')
  .post(
    verifyJWT,
    playlistMutationLimiter,
    validate(playlistVideoParamsSchema, 'params'),
    addVideoToPlaylist
  )
  .delete(
    verifyJWT,
    playlistMutationLimiter,
    validate(playlistVideoParamsSchema, 'params'),
    removeVideoFromPlaylist
  );

export default router;
