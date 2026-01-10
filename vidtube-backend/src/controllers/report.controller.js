// ============================================
// IMPORTS & DEPENDENCIES
// ============================================
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from '../errors/index.js';
import {
  validateObjectId,
  validateRequired,
  validateStringLength,
} from '../utils/validation.js';

// Models
import Report from '../models/report.model.js';
import Video from '../models/video.model.js';
import Comment from '../models/comment.model.js';
import { User } from '../models/user.model.js';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Normalize pagination parameters
 */
const getPaginationParams = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  let limit = parseInt(query.limit, 10) || 10;
  if (limit > 50) limit = 50;
  if (limit < 1) limit = 1;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build reporter lookup pipeline
 */
const reporterLookupPipeline = [
  {
    $lookup: {
      from: 'users',
      localField: 'reportedBy',
      foreignField: '_id',
      as: 'reportedBy',
      pipeline: [
        {
          $project: {
            username: 1,
            fullName: 1,
          },
        },
      ],
    },
  },
  {
    $addFields: {
      reportedBy: { $first: '$reportedBy' },
    },
  },
];

// ============================================
// REPORT MANAGEMENT
// ============================================

/**
 * Create a report (video, comment, user, or channel)
 * @route POST /api/v1/reports
 * @access Private
 */
const createReport = asyncHandler(async (req, res) => {
  const { type, reportedItem, reason, description } = req.body;

  // Validate required fields
  validateRequired({ type, reportedItem, reason }, [
    'type',
    'reportedItem',
    'reason',
  ]);

  // Validate type
  const validTypes = ['video', 'comment', 'user', 'channel'];
  if (!validTypes.includes(type)) {
    throw new ValidationError('Invalid report type', [
      {
        field: 'type',
        message: `Type must be one of: ${validTypes.join(', ')}`,
      },
    ]);
  }

  // Validate reason
  const validReasons = [
    'spam',
    'harassment',
    'hate_speech',
    'inappropriate_content',
    'copyright',
    'violence',
    'other',
  ];
  if (!validReasons.includes(reason)) {
    throw new ValidationError('Invalid reason', [
      {
        field: 'reason',
        message: `Reason must be one of: ${validReasons.join(', ')}`,
      },
    ]);
  }

  validateObjectId(reportedItem, 'reportedItem');

  // Verify that the reported item exists
  let item;
  switch (type) {
    case 'video':
      item = await Video.findById(reportedItem);
      if (!item) {
        throw new NotFoundError('Video not found');
      }
      break;
    case 'comment':
      item = await Comment.findById(reportedItem);
      if (!item) {
        throw new NotFoundError('Comment not found');
      }
      break;
    case 'user':
    case 'channel':
      item = await User.findById(reportedItem);
      if (!item) {
        throw new NotFoundError('User not found');
      }
      break;
  }

  // Check if user has already reported this item
  const existingReport = await Report.findOne({
    reportedBy: req.user._id,
    type,
    reportedItem,
  });

  if (existingReport) {
    throw new apiError(409, 'You have already reported this item');
  }

  // Create report
  const report = await Report.create({
    reportedBy: req.user._id,
    type,
    reportedItem,
    reason,
    description: description
      ? validateStringLength(description, 0, 1000, 'description')
      : '',
    status: 'pending',
  });

  await report.populate('reportedBy', 'username fullName');

  const response = apiResponse(201, 'Report created successfully', report);

  res.status(201).json(response);
});

/**
 * Get all reports (Admin only)
 * @route GET /api/v1/reports
 * @access Private (Admin)
 */
const getAllReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status, type } = req.query;

  // Check if user is admin (you'll need to add admin check)
  // For now, we'll assume the endpoint is protected at the route level

  const matchStage = {};
  if (status) matchStage.status = status;
  if (type) matchStage.type = type;

  const pipeline = [
    { $match: matchStage },
    ...reporterLookupPipeline,
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ];

  const reports = await Report.aggregate(pipeline);
  const totalCount = await Report.countDocuments(matchStage);

  const response = apiResponse(200, 'Reports fetched successfully', {
    reports,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
      hasPrevPage: page > 1,
    },
  });

  res.status(200).json(response);
});

/**
 * Get a single report by ID (Admin only)
 * @route GET /api/v1/reports/:reportId
 * @access Private (Admin)
 */
const getReportById = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  validateObjectId(reportId, 'reportId');

  const report = await Report.findById(reportId)
    .populate('reportedBy', 'username fullName email')
    .populate('reviewedBy', 'username fullName');

  if (!report) {
    throw new NotFoundError('Report not found');
  }

  const response = apiResponse(200, 'Report fetched successfully', report);

  res.status(200).json(response);
});

/**
 * Update report status (Admin only)
 * @route PATCH /api/v1/reports/:reportId
 * @access Private (Admin)
 */
const updateReportStatus = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { status, notes } = req.body;

  validateObjectId(reportId, 'reportId');

  const validStatuses = ['pending', 'reviewing', 'resolved', 'dismissed'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError('Invalid status', [
      {
        field: 'status',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      },
    ]);
  }

  const report = await Report.findById(reportId);
  if (!report) {
    throw new NotFoundError('Report not found');
  }

  report.status = status;
  if (status !== 'pending') {
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
  }
  if (notes) {
    report.notes = notes;
  }

  await report.save();

  const response = apiResponse(
    200,
    'Report status updated successfully',
    report
  );

  res.status(200).json(response);
});

/**
 * Delete a report (Admin only)
 * @route DELETE /api/v1/reports/:reportId
 * @access Private (Admin)
 */
const deleteReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  validateObjectId(reportId, 'reportId');

  const report = await Report.findById(reportId);
  if (!report) {
    throw new NotFoundError('Report not found');
  }

  await Report.deleteOne({ _id: reportId });

  const response = apiResponse(200, 'Report deleted successfully', null);

  res.status(200).json(response);
});

/**
 * Get reports by current user
 * @route GET /api/v1/reports/my-reports
 * @access Private
 */
const getMyReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);

  const reports = await Report.find({ reportedBy: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('reportedBy', 'username fullName');

  const totalCount = await Report.countDocuments({ reportedBy: req.user._id });

  const response = apiResponse(200, 'Your reports fetched successfully', {
    reports,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
      hasPrevPage: page > 1,
    },
  });

  res.status(200).json(response);
});

// ============================================
// EXPORTS
// ============================================

export {
  createReport,
  getAllReports,
  getReportById,
  updateReportStatus,
  deleteReport,
  getMyReports,
};
