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
import { validate } from '../middlewares/validate.middleware.js';
import {
  createReportSchema,
  reportsQuerySchema,
  reportIdParamSchema,
  updateReportStatusSchema,
} from '../validators/report.validator.js';

const router = Router();

// ============================================
// PROTECTED ROUTES
// ============================================

router
  .route('/')
  .post(
    verifyJWT,
    reportCreateLimiter,
    validate(createReportSchema),
    createReport
  );

// User routes
router
  .route('/my-reports')
  .get(verifyJWT, validate(reportsQuerySchema, 'query'), getMyReports);

// Admin routes
router
  .route('/')
  .get(
    verifyJWT,
    adminModerationLimiter,
    requireRole('admin'),
    validate(reportsQuerySchema, 'query'),
    getAllReports
  );
router
  .route('/:reportId')
  .get(
    verifyJWT,
    adminModerationLimiter,
    requireRole('admin'),
    validate(reportIdParamSchema, 'params'),
    getReportById
  )
  .patch(
    verifyJWT,
    adminModerationLimiter,
    requireRole('admin'),
    validate(reportIdParamSchema, 'params'),
    validate(updateReportStatusSchema),
    updateReportStatus
  )
  .delete(
    verifyJWT,
    adminModerationLimiter,
    requireRole('admin'),
    validate(reportIdParamSchema, 'params'),
    deleteReport
  );

export default router;
