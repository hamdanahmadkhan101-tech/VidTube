import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUserProfile,
  updateUserProfile,
} from '../controllers/user.controller.js';
import upload from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// ============================================
// PUBLIC ROUTES (Authentication)
// ============================================
router.route('/register').post(
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  registerUser
);
router.route('/login').post(loginUser);
router.route('/refresh-token').post(refreshAccessToken);

// ============================================
// PROTECTED ROUTES (Require Authentication)
// ============================================

// Auth Management
router.route('/logout').post(verifyJWT, logoutUser);

// Profile Operations
router.route('/profile').get(verifyJWT, getCurrentUserProfile);
router.route('/update-profile').patch(verifyJWT, updateUserProfile);

// Account Settings
router.route('/change-password').patch(verifyJWT, changeCurrentUserPassword);
router
  .route('/avatar')
  .patch(verifyJWT, upload.single('avatar'), updateUserAvatar);
router
  .route('/cover-image')
  .patch(verifyJWT, upload.single('coverImage'), updateUserCoverImage);

  
export default router;
