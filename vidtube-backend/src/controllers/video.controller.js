// ============================================
// IMPORTS & DEPENDENCIES
// ============================================
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';

// Models
import Video from '../models/video.model.js';
import { User } from '../models/user.model.js';
import Like from '../models/like.model.js';
import Comment from '../models/comment.model.js';

// Services
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from '../utils/cloudinary.js';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate and normalize pagination parameters
 * @param {Object} query - Express request query object
 * @returns {{ page: number, limit: number, skip: number }}
 */
const getPaginationParams = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  let limit = parseInt(query.limit, 10) || 10;

  // Enforce maximum items per page
  if (limit > 50) limit = 50;
  if (limit < 1) limit = 1;

  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - The id string to validate
 * @param {string} fieldName - Field name for error messages
 */
const validateObjectId = (id, fieldName = 'ID') => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, `Invalid ${fieldName}`);
  }
};

/**
 * Build common owner lookup pipeline
 */
const ownerLookupPipeline = [
  {
    $lookup: {
      from: 'users',
      localField: 'owner',
      foreignField: '_id',
      as: 'owner',
      pipeline: [
        {
          $project: {
            username: 1,
            fullName: 1,
            avatarUrl: 1,
          },
        },
      ],
    },
  },
  {
    $addFields: {
      owner: { $first: '$owner' },
    },
  },
];

// ============================================
// CORE VIDEO MANAGEMENT
// ============================================

/**
 * Upload a new video with thumbnail
 * @route POST /api/v1/videos/upload
 * @access Private
 */
const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description = '', videoformat, duration } = req.body;

  if (!title || !videoformat || !duration) {
    throw new apiError(400, 'title, videoformat and duration are required');
  }

  const numericDuration = Number(duration);
  if (Number.isNaN(numericDuration) || numericDuration <= 0) {
    throw new apiError(400, 'duration must be a positive number');
  }

  const videoPath = req.files?.video?.[0]?.path ?? null;
  const thumbnailPath = req.files?.thumbnail?.[0]?.path ?? null;

  if (!videoPath) {
    throw new apiError(400, 'Video file is required');
  }

  // Optional: basic mime/type validation could be added at multer level

  const videoUploadResult = await uploadOnCloudinary(videoPath);
  if (!videoUploadResult?.url) {
    throw new apiError(500, 'Video upload failed');
  }

  const thumbnailUploadResult = await uploadOnCloudinary(thumbnailPath);

  const newVideo = await Video.create({
    title: title.trim(),
    description: description.trim(),
    videoformat: String(videoformat).trim(),
    duration: numericDuration,
    url: videoUploadResult.url,
    thumbnailUrl: thumbnailUploadResult?.url || '',
    owner: req.user._id,
  });

  // Return video with populated owner details
  const [createdVideo] = await Video.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(newVideo._id) } },
    ...ownerLookupPipeline,
  ]);

  res
    .status(201)
    .json(
      new apiResponse(201, 'Video uploaded successfully', createdVideo || newVideo)
    );
});

/**
 * Get paginated list of published videos
 * @route GET /api/v1/videos
 * @access Public
 */
const getAllVideos = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const sortBy = req.query.sortBy || 'createdAt';
  const sortType = req.query.sortType === 'asc' ? 1 : -1;

  const sortStage = { [sortBy]: sortType };

  const pipeline = [
    {
      $match: {
        isPublished: true,
      },
    },
    ...ownerLookupPipeline,
    {
      $sort: sortStage,
    },
  ];

  const aggregate = Video.aggregate(pipeline);
  const result = await Video.aggregatePaginate(aggregate, {
    page,
    limit,
  });

  res
    .status(200)
    .json(new apiResponse(200, 'Videos fetched successfully', result));
});

/**
 * Get a single video by ID with owner and engagement details
 * @route GET /api/v1/videos/:videoId
 * @access Public (published only) / Private (owner can see unpublished)
 */
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  validateObjectId(videoId, 'videoId');

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, 'Video not found');
  }

  const isOwner =
    req.user && video.owner && video.owner.toString() === req.user._id.toString();

  if (!video.isPublished && !isOwner) {
    throw new apiError(403, 'Video is not published');
  }

  // Only increment views for non-owners to avoid inflating own video views
  if (!isOwner) {
    await Video.findByIdAndUpdate(
      videoId,
      { $inc: { views: 1 } },
      { new: false }
    );
  }

  const currentUserId = req.user?._id
    ? new mongoose.Types.ObjectId(req.user._id)
    : null;

  const pipeline = [
    {
      $match: { _id: new mongoose.Types.ObjectId(videoId) },
    },
    ...ownerLookupPipeline,
    {
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'video',
        as: 'likes',
      },
    },
    {
      $lookup: {
        from: 'comments',
        localField: '_id',
        foreignField: 'video',
        as: 'comments',
      },
    },
  ];

  // Add engagement fields via aggregation
  if (currentUserId) {
    pipeline.push({
      $addFields: {
        likesCount: { $size: '$likes' },
        commentsCount: { $size: '$comments' },
        isLiked: {
          $in: [currentUserId, '$likes.likedBy'],
        },
      },
    });
  } else {
    pipeline.push({
      $addFields: {
        likesCount: { $size: '$likes' },
        commentsCount: { $size: '$comments' },
        isLiked: false,
      },
    });
  }

  pipeline.push({
    $project: {
      likes: 0,
      comments: 0,
    },
  });

  const [detailedVideo] = await Video.aggregate(pipeline);

  res
    .status(200)
    .json(
      new apiResponse(200, 'Video fetched successfully', detailedVideo || video)
    );
});

// ============================================
// VIDEO MANAGEMENT
// ============================================

/**
 * Update video details (title, description, optional thumbnail)
 * @route PATCH /api/v1/videos/:videoId
 * @access Private (owner only)
 */
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  validateObjectId(videoId, 'videoId');

  const { title, description } = req.body;
  const thumbnailPath = req.files?.thumbnail?.[0]?.path ?? null;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, 'Video not found');
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new apiError(403, 'You are not allowed to update this video');
  }

  const updatePayload = {};
  if (typeof title === 'string' && title.trim()) {
    updatePayload.title = title.trim();
  }
  if (typeof description === 'string') {
    updatePayload.description = description.trim();
  }

  // Handle optional thumbnail update
  if (thumbnailPath) {
    const newThumb = await uploadOnCloudinary(thumbnailPath);
    if (!newThumb?.url) {
      throw new apiError(500, 'Thumbnail upload failed');
    }

    // Clean up old thumbnail from Cloudinary
    if (video.thumbnailUrl) {
      await deleteFromCloudinary(video.thumbnailUrl);
    }

    updatePayload.thumbnailUrl = newThumb.url;
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: updatePayload },
    { new: true }
  );

  res
    .status(200)
    .json(new apiResponse(200, 'Video updated successfully', updatedVideo));
});

/**
 * Delete a video and perform cleanup
 * @route DELETE /api/v1/videos/:videoId
 * @access Private (owner only)
 */
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  validateObjectId(videoId, 'videoId');

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, 'Video not found');
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new apiError(403, 'You are not allowed to delete this video');
  }

  // Delete media from Cloudinary
  if (video.url) {
    await deleteFromCloudinary(video.url);
  }
  if (video.thumbnailUrl) {
    await deleteFromCloudinary(video.thumbnailUrl);
  }

  // Remove video from all users' watch history
  await User.updateMany(
    { watchHistory: video._id },
    { $pull: { watchHistory: video._id } }
  );

  await Video.deleteOne({ _id: video._id });

  res
    .status(200)
    .json(new apiResponse(200, 'Video deleted successfully'));
});

/**
 * Toggle video publish status
 * @route PATCH /api/v1/videos/toggle/publish/:videoId
 * @access Private (owner only)
 */
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  validateObjectId(videoId, 'videoId');

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, 'Video not found');
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new apiError(403, 'You are not allowed to update this video');
  }

  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(
      new apiResponse(200, 'Video publish status updated', {
        videoId: video._id,
        isPublished: video.isPublished,
      })
    );
});

// ============================================
// VIDEO DISCOVERY
// ============================================

/**
 * Search videos by title or description
 * @route GET /api/v1/videos/search
 * @access Public
 */
const searchVideos = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query || !query.trim()) {
    throw new apiError(400, 'Search query is required');
  }

  const { page, limit, skip } = getPaginationParams(req.query);

  const matchStage = {
    isPublished: true,
    $or: [
      { title: { $regex: query.trim(), $options: 'i' } },
      { description: { $regex: query.trim(), $options: 'i' } },
    ],
  };

  const pipeline = [
    { $match: matchStage },
    ...ownerLookupPipeline,
    { $sort: { createdAt: -1 } },
  ];

  const aggregate = Video.aggregate(pipeline);
  const result = await Video.aggregatePaginate(aggregate, {
    page,
    limit,
  });

  res
    .status(200)
    .json(new apiResponse(200, 'Videos searched successfully', result));
});

/**
 * Get videos by owner
 * @route GET /api/v1/videos/user/:userId
 * @access Public (only published) / Private (owner can see all)
 */
const getVideosByOwner = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  validateObjectId(userId, 'userId');

  const { page, limit, skip } = getPaginationParams(req.query);
  const isOwner =
    req.user && req.user._id && req.user._id.toString() === userId.toString();

  const matchStage = {
    owner: new mongoose.Types.ObjectId(userId),
  };

  if (!isOwner) {
    matchStage.isPublished = true;
  }

  const pipeline = [
    { $match: matchStage },
    ...ownerLookupPipeline,
    { $sort: { createdAt: -1 } },
  ];

  const aggregate = Video.aggregate(pipeline);
  const result = await Video.aggregatePaginate(aggregate, {
    page,
    limit,
  });

  res
    .status(200)
    .json(new apiResponse(200, 'Owner videos fetched successfully', result));
});

// ============================================
// VIDEO INTERACTIONS
// ============================================

/**
 * Add video to user's watch history and increment views
 * @route POST /api/v1/videos/:videoId/watch
 * @access Private
 */
const addVideoToWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  validateObjectId(videoId, 'videoId');

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, 'Video not found');
  }

  // Increment views
  await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { new: false }
  );

  // Avoid duplicates in watch history
  const alreadyInHistory = req.user.watchHistory?.some(
    (v) => v.toString() === videoId.toString()
  );

  if (!alreadyInHistory) {
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { watchHistory: videoId } },
      { new: true }
    );
  }

  res
    .status(200)
    .json(
      new apiResponse(200, 'Video added to watch history successfully', {
        videoId,
      })
    );
});

// ============================================
// EXPORTS
// ============================================

export {
  // Core Video Management
  uploadVideo,
  getAllVideos,
  getVideoById,

  // Video Management
  updateVideo,
  deleteVideo,
  togglePublishStatus,

  // Video Discovery
  searchVideos,
  getVideosByOwner,

  // Video Interactions
  addVideoToWatchHistory,
};


