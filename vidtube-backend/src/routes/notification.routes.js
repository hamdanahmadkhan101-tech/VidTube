import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification,
} from '../controllers/notification.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// ============================================
// PROTECTED ROUTES
// ============================================

router.route('/').get(verifyJWT, getNotifications);
router.route('/').delete(verifyJWT, deleteAllNotifications);

router.route('/unread/count').get(verifyJWT, getUnreadCount);

router.route('/:notificationId/read').patch(verifyJWT, markAsRead);
router.route('/read-all').patch(verifyJWT, markAllAsRead);

router.route('/:notificationId').delete(verifyJWT, deleteNotification);

// Internal route for creating notifications (should be protected differently in production)
router.route('/').post(verifyJWT, createNotification);

export default router;
