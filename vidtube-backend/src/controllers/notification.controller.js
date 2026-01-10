// ============================================
// IMPORTS & DEPENDENCIES
// ============================================
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';
import { NotFoundError, ValidationError } from '../errors/index.js';
import {
  validateObjectId,
  validateRequired,
  validateStringLength,
} from '../utils/validation.js';

// Models
import Notification from '../models/notification.model.js';

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

// ============================================
// NOTIFICATION MANAGEMENT
// ============================================

/**
 * Get user's notifications
 * @route GET /api/v1/notifications
 * @access Private
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { unreadOnly = false } = req.query;

  const matchStage = { recipient: req.user._id };

  if (unreadOnly === 'true') {
    matchStage.isRead = false;
  }

  const notifications = await Notification.find(matchStage)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'relatedVideo',
      select: 'title thumbnailUrl',
    })
    .populate({
      path: 'relatedUser',
      select: 'username fullName avatarUrl',
    });

  const totalCount = await Notification.countDocuments(matchStage);

  const response = apiResponse(200, 'Notifications fetched successfully', {
    notifications,
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
 * Get unread notification count
 * @route GET /api/v1/notifications/unread/count
 * @access Private
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  const response = apiResponse(200, 'Unread count fetched successfully', {
    unreadCount,
  });

  res.status(200).json(response);
});

/**
 * Mark notification as read
 * @route PATCH /api/v1/notifications/:notificationId/read
 * @access Private
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  validateObjectId(notificationId, 'notificationId');

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  // Verify ownership
  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw new apiError(403, 'You can only mark your own notifications as read');
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  const response = apiResponse(
    200,
    'Notification marked as read',
    notification
  );

  res.status(200).json(response);
});

/**
 * Mark all notifications as read
 * @route PATCH /api/v1/notifications/read-all
 * @access Private
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    {
      recipient: req.user._id,
      isRead: false,
    },
    {
      $set: { isRead: true, readAt: new Date() },
    }
  );

  const response = apiResponse(200, 'All notifications marked as read', {
    modifiedCount: result.modifiedCount,
  });

  res.status(200).json(response);
});

/**
 * Delete a notification
 * @route DELETE /api/v1/notifications/:notificationId
 * @access Private
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  validateObjectId(notificationId, 'notificationId');

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  // Verify ownership
  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw new apiError(403, 'You can only delete your own notifications');
  }

  await Notification.deleteOne({ _id: notificationId });

  const response = apiResponse(200, 'Notification deleted successfully', null);

  res.status(200).json(response);
});

/**
 * Delete all notifications for a user
 * @route DELETE /api/v1/notifications
 * @access Private
 */
const deleteAllNotifications = asyncHandler(async (req, res) => {
  const result = await Notification.deleteMany({ recipient: req.user._id });

  const response = apiResponse(200, 'All notifications deleted successfully', {
    deletedCount: result.deletedCount,
  });

  res.status(200).json(response);
});

/**
 * Create a notification (Internal use - called by other services)
 * @route POST /api/v1/notifications (Internal)
 * @access Private (System)
 */
const createNotification = asyncHandler(async (req, res) => {
  const { recipient, type, title, message, relatedVideo, relatedUser } =
    req.body;

  // Validate required fields
  validateRequired({ recipient, type, title, message }, [
    'recipient',
    'type',
    'title',
    'message',
  ]);

  // Validate type
  const validTypes = [
    'like',
    'comment',
    'subscription',
    'video_upload',
    'mention',
    'system',
  ];
  if (!validTypes.includes(type)) {
    throw new ValidationError('Invalid notification type', [
      {
        field: 'type',
        message: `Type must be one of: ${validTypes.join(', ')}`,
      },
    ]);
  }

  const notification = await Notification.create({
    recipient,
    type,
    title: validateStringLength(title, 1, 200, 'title'),
    message: validateStringLength(message, 1, 500, 'message'),
    relatedVideo: relatedVideo || null,
    relatedUser: relatedUser || null,
  });

  const response = apiResponse(
    201,
    'Notification created successfully',
    notification
  );

  res.status(201).json(response);
});

// ============================================
// EXPORTS
// ============================================

export {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification,
};
