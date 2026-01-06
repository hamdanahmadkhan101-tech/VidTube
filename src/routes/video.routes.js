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
  getVideosByOwner,

  // Video Interactions
  addVideoToWatchHistory,
} from '../controllers/video.controller.js';
import { uploadVideo as uploadVideoMiddleware, uploadImage } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

router.route('/').get(getAllVideos);
router.route('/search').get(searchVideos);
router.route('/user/:userId').get(getVideosByOwner);
router.route('/:videoId').get(getVideoById);

// ============================================
// PROTECTED ROUTES
// ============================================

router
  .route('/upload')
  .post(
    verifyJWT,
    uploadVideoMiddleware.fields([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
    uploadVideo
  );

router
  .route('/toggle/publish/:videoId')
  .patch(verifyJWT, togglePublishStatus);

router
  .route('/:videoId')
  .patch(
    verifyJWT,
    uploadImage.fields([{ name: 'thumbnail', maxCount: 1 }]),
    updateVideo
  )
  .delete(verifyJWT, deleteVideo);

router.route('/:videoId/watch').post(verifyJWT, addVideoToWatchHistory);

export default router;


