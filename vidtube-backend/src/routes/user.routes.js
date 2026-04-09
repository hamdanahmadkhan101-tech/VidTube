import { Router } from 'express';
import {
  // Authentication Controllers
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,

  // Profile Management Controllers
  getCurrentUserProfile,
  updateUserProfile,
  updateUserAvatar,
  updateUserCoverImage,

  // Account Security Controllers
  changeCurrentUserPassword,

  // Channel & Social Controllers
  getUserChannelProfile,
  toggleSubscription,

  // Content Controllers
  getUserWatchHistory,
} from '../controllers/user.controller.js';
import { User } from '../models/user.model.js';
import { uploadImage } from '../middlewares/multer.middleware.js';
import { verifyJWT, optionalJWT } from '../middlewares/auth.middleware.js';
import {
  authLimiter,
  availabilityLimiter,
  profileMutationLimiter,
  subscriptionLimiter,
} from '../middlewares/rateLimit.middleware.js';

const router = Router();

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

// User Registration & Authentication
router.route('/register').post(
  authLimiter,
  uploadImage.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  registerUser
);
router.route('/login').post(authLimiter, loginUser);
router.route('/refresh-token').post(authLimiter, refreshAccessToken);

// Availability checks (for frontend validation)
router
  .route('/check-username/:username')
  .get(availabilityLimiter, async (req, res) => {
    try {
      const { username } = req.params;
      const user = await User.findOne({ username: username.toLowerCase() });
      if (user) {
        return res.status(200).json({ message: 'Username already exists' });
      }
      res.status(404).json({ message: 'Username is available' });
    } catch (error) {
      res.status(500).json({ message: 'Error checking username' });
    }
  });

router
  .route('/check-email/:email')
  .get(availabilityLimiter, async (req, res) => {
    try {
      const { email } = req.params;
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        return res.status(200).json({ message: 'Email already exists' });
      }
      res.status(404).json({ message: 'Email is available' });
    } catch (error) {
      res.status(500).json({ message: 'Error checking email' });
    }
  });

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

// Authentication Management
router.route('/logout').post(verifyJWT, logoutUser);

// Profile Information & Management
router.route('/profile').get(verifyJWT, getCurrentUserProfile);
router
  .route('/update-profile')
  .patch(verifyJWT, profileMutationLimiter, updateUserProfile);

// Media Upload & Management
router
  .route('/avatar')
  .patch(
    verifyJWT,
    profileMutationLimiter,
    uploadImage.single('avatar'),
    updateUserAvatar
  );
router
  .route('/cover-image')
  .patch(
    verifyJWT,
    profileMutationLimiter,
    uploadImage.single('coverImage'),
    updateUserCoverImage
  );

// Account Security
router
  .route('/change-password')
  .patch(verifyJWT, profileMutationLimiter, changeCurrentUserPassword);

// Channel & Social Features (public with optional auth for isSubscribed)
router.route('/c/:username').get(optionalJWT, getUserChannelProfile);
router
  .route('/toggle-subscription/:channelId')
  .post(verifyJWT, subscriptionLimiter, toggleSubscription);

// Content & History
router.route('/watch-history').get(verifyJWT, getUserWatchHistory);

export default router;
