import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../controllers/notification.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  notificationReadLimiter,
  notificationMutationLimiter,
} from '../middlewares/rateLimit.middleware.js';

const router = Router();

// ============================================
// PROTECTED ROUTES
// ============================================

router.route('/').get(verifyJWT, notificationReadLimiter, getNotifications);
router
  .route('/')
  .delete(verifyJWT, notificationMutationLimiter, deleteAllNotifications);

router
  .route('/unread/count')
  .get(verifyJWT, notificationReadLimiter, getUnreadCount);

router
  .route('/:notificationId/read')
  .patch(verifyJWT, notificationMutationLimiter, markAsRead);
router
  .route('/read-all')
  .patch(verifyJWT, notificationMutationLimiter, markAllAsRead);

router
  .route('/:notificationId')
  .delete(verifyJWT, notificationMutationLimiter, deleteNotification);

export default router;
