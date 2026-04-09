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

const router = Router();

// ============================================
// PROTECTED ROUTES
// ============================================

router.route('/').post(verifyJWT, createReport);

// User routes
router.route('/my-reports').get(verifyJWT, getMyReports);

// Admin routes
router.route('/').get(verifyJWT, requireRole('admin'), getAllReports);
router
  .route('/:reportId')
  .get(verifyJWT, requireRole('admin'), getReportById)
  .patch(verifyJWT, requireRole('admin'), updateReportStatus)
  .delete(verifyJWT, requireRole('admin'), deleteReport);

export default router;
