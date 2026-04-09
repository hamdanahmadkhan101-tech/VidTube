import { Router } from 'express';
import {
  createReport,
  getAllReports,
  getReportById,
  updateReportStatus,
  deleteReport,
  getMyReports,
} from '../controllers/report.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/authorize.middleware.js';
import {
  reportCreateLimiter,
  adminModerationLimiter,
} from '../middlewares/rateLimit.middleware.js';

const router = Router();

// ============================================
// PROTECTED ROUTES
// ============================================

router.route('/').post(verifyJWT, reportCreateLimiter, createReport);

// User routes
router.route('/my-reports').get(verifyJWT, getMyReports);

// Admin routes
router
  .route('/')
  .get(verifyJWT, adminModerationLimiter, requireRole('admin'), getAllReports);
router
  .route('/:reportId')
  .get(verifyJWT, adminModerationLimiter, requireRole('admin'), getReportById)
  .patch(
    verifyJWT,
    adminModerationLimiter,
    requireRole('admin'),
    updateReportStatus
  )
  .delete(
    verifyJWT,
    adminModerationLimiter,
    requireRole('admin'),
    deleteReport
  );

export default router;
