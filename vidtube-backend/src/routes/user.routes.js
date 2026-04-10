import { Router } from 'express';
import {
  // Authentication Controllers
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  verifyEmailOtp,
  resendVerificationOtp,
  requestPasswordResetOtp,
  resetPasswordWithOtp,

  // Profile Management Controllers
  getCurrentUserProfile,
  updateUserProfile,
  updateUserAvatar,
  updateUserCoverImage,
  getUserPreferences,
  updateUserPreferences,

  // Account Security Controllers
  changeCurrentUserPassword,

  // Channel & Social Controllers
  getUserChannelProfile,
  toggleSubscription,

  // Content Controllers
  getUserWatchHistory,
  getUserWatchLater,
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
import { validate } from '../middlewares/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailOtpSchema,
  resendVerificationOtpSchema,
  requestPasswordResetOtpSchema,
  resetPasswordWithOtpSchema,
  updateProfileSchema,
  changePasswordSchema,
  updatePreferencesSchema,
  usernameAvailabilityParamSchema,
  emailAvailabilityParamSchema,
} from '../validators/user.validator.js';
import {
  buildObjectIdParamSchema,
  paginationQuerySchema,
} from '../validators/common.validator.js';

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
  validate(registerSchema),
  registerUser
);
router.route('/login').post(authLimiter, validate(loginSchema), loginUser);
router.route('/refresh-token').post(authLimiter, refreshAccessToken);
router
  .route('/verify-email-otp')
  .post(authLimiter, validate(verifyEmailOtpSchema), verifyEmailOtp);
router
  .route('/resend-verification-otp')
  .post(
    authLimiter,
    validate(resendVerificationOtpSchema),
    resendVerificationOtp
  );
router
  .route('/forgot-password-otp')
  .post(
    authLimiter,
    validate(requestPasswordResetOtpSchema),
    requestPasswordResetOtp
  );
router
  .route('/reset-password-otp')
  .post(
    authLimiter,
    validate(resetPasswordWithOtpSchema),
    resetPasswordWithOtp
  );

// Availability checks (for frontend validation)
router
  .route('/check-username/:username')
  .get(
    availabilityLimiter,
    validate(usernameAvailabilityParamSchema, 'params'),
    async (req, res) => {
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
    }
  );

router
  .route('/check-email/:email')
  .get(
    availabilityLimiter,
    validate(emailAvailabilityParamSchema, 'params'),
    async (req, res) => {
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
    }
  );

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

// Authentication Management
router.route('/logout').post(verifyJWT, logoutUser);

// Profile Information & Management
router.route('/profile').get(verifyJWT, getCurrentUserProfile);
router.route('/preferences').get(verifyJWT, getUserPreferences);
router
  .route('/preferences')
  .patch(
    verifyJWT,
    profileMutationLimiter,
    validate(updatePreferencesSchema),
    updateUserPreferences
  );
router
  .route('/update-profile')
  .patch(
    verifyJWT,
    profileMutationLimiter,
    validate(updateProfileSchema),
    updateUserProfile
  );

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
  .patch(
    verifyJWT,
    profileMutationLimiter,
    validate(changePasswordSchema),
    changeCurrentUserPassword
  );

// Channel & Social Features (public with optional auth for isSubscribed)
router
  .route('/c/:username')
  .get(
    optionalJWT,
    validate(usernameAvailabilityParamSchema, 'params'),
    getUserChannelProfile
  );
router
  .route('/toggle-subscription/:channelId')
  .post(
    verifyJWT,
    subscriptionLimiter,
    validate(buildObjectIdParamSchema('channelId'), 'params'),
    toggleSubscription
  );

// Content & History
router
  .route('/watch-history')
  .get(
    verifyJWT,
    validate(paginationQuerySchema, 'query'),
    getUserWatchHistory
  );

router
  .route('/watch-later')
  .get(verifyJWT, validate(paginationQuerySchema, 'query'), getUserWatchLater);

export default router;
