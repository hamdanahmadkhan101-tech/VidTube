import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUserProfile,
  updateAccountDetails,
} from '../controllers/user.controller.js';
import upload from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Use multer middleware to parse form-data
router.route('/register').post(
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  registerUser
);
router.route('/login').post(loginUser);
// secured routes
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/change-password').post(verifyJWT, changeCurrentUserPassword);
router.route('/profile').get(verifyJWT, getCurrentUserProfile);
router.route('/update-account').put(verifyJWT, updateAccountDetails);
router
  .route('/update-avatar')
  .put(verifyJWT, upload.single('avatar'), updateUserAvatar);
router
  .route('/update-cover')
  .put(verifyJWT, upload.single('coverImage'), updateUserCoverImage);

export default router;
