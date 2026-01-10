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

const router = Router();

// ============================================
// PROTECTED ROUTES
// ============================================

router.route('/').post(verifyJWT, createReport);

// Admin routes
router.route('/').get(verifyJWT, getAllReports); // Should add admin check
router.route('/:reportId').get(verifyJWT, getReportById); // Should add admin check
router.route('/:reportId').patch(verifyJWT, updateReportStatus); // Should add admin check
router.route('/:reportId').delete(verifyJWT, deleteReport); // Should add admin check

// User routes
router.route('/my-reports').get(verifyJWT, getMyReports);

export default router;
