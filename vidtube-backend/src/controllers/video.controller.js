// ============================================
// IMPORTS & DEPENDENCIES
// ============================================
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';
import { ValidationError, NotFoundError, ForbiddenError } from '../errors/index.js';
import { getPaginationParams, getSortParams } from '../utils/pagination.js';
import { validateObjectId, validateRequired, validateNumericRange, validateStringLength } from '../utils/validation.js';
import { formatVideo } from '../utils/formatters.js';

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

  // Validate required fields
  validateRequired({ title, videoformat, duration }, ['title', 'videoformat', 'duration']);

  // Validate string fields
  const validatedTitle = validateStringLength(title, 1, 200, 'title');
  const validatedDescription = description ? validateStringLength(description, 0, 5000, 'description') : '';
  const validatedFormat = validateStringLength(videoformat, 1, 20, 'videoformat');

  // Validate duration
  const numericDuration = validateNumericRange(duration, 0.01, 86400, 'duration'); // Max 24 hours

  const videoPath = req.files?.video?.[0]?.path ?? null;
  const thumbnailPath = req.files?.thumbnail?.[0]?.path ?? null;

  if (!videoPath) {
    throw new ValidationError('Video file is required', [
      { field: 'video', message: 'Video file is required' },
    ]);
  }

  // Upload video to Cloudinary
  const videoUploadResult = await uploadOnCloudinary(videoPath);
  if (!videoUploadResult?.url) {
    throw new apiError(500, 'Video upload to cloud storage failed');
  }

  // Upload thumbnail if provided
  const thumbnailUploadResult = thumbnailPath
    ? await uploadOnCloudinary(thumbnailPath)
    : null;

  const newVideo = await Video.create({
    title: validatedTitle,
    description: validatedDescription,
    videoformat: validatedFormat,
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

  res.status(201).json(
    new apiResponse(201, 'Video uploaded successfully', formatVideo(createdVideo || newVideo))
  );
});

/**
 * Get paginated list of published videos
 * @route GET /api/v1/videos
 * @access Public
 */
const getAllVideos = asyncHandler(async (req, res) => {
  const { page, limit } = getPaginationParams(req.query);
  const allowedSortFields = ['createdAt', 'views', 'title'];
  const { sortStage } = getSortParams(
    req.query.sortBy,
    req.query.sortType,
    allowedSortFields
  );

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

  // Format videos and use standardized paginated response
  const formattedVideos = (result.docs || []).map(formatVideo);
  const response = apiResponse.paginated(
    200,
    'Videos fetched successfully',
    {
      ...result,
      docs: formattedVideos,
    }
  );

  res.status(200).json(response);
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
    throw new NotFoundError('Video', videoId);
  }

  const isOwner =
    req.user &&
    video.owner &&
    video.owner.toString() === req.user._id.toString();

  if (!video.isPublished && !isOwner) {
    throw new ForbiddenError('This video is not published and cannot be accessed');
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

  if (!detailedVideo) {
    throw new NotFoundError('Video', videoId);
  }

  res.status(200).json(
    new apiResponse(200, 'Video fetched successfully', formatVideo(detailedVideo))
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
    throw new NotFoundError('Video', videoId);
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You do not have permission to update this video');
  }

  const updatePayload = {};
  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      throw new ValidationError('Invalid title', [
        { field: 'title', message: 'Title must be a non-empty string' },
      ]);
    }
    updatePayload.title = validateStringLength(title, 1, 200, 'title');
  }
  if (description !== undefined) {
    updatePayload.description = description
      ? validateStringLength(description, 0, 5000, 'description')
      : '';
  }

  // Handle optional thumbnail update
  if (thumbnailPath) {
    const newThumb = await uploadOnCloudinary(thumbnailPath);
    if (!newThumb?.url) {
      throw new apiError(500, 'Thumbnail upload to cloud storage failed');
    }

    // Clean up old thumbnail from Cloudinary
    if (video.thumbnailUrl) {
      await deleteFromCloudinary(video.thumbnailUrl).catch((err) => {
        // Log but don't fail if deletion fails
        console.error('Failed to delete old thumbnail:', err);
      });
    }

    updatePayload.thumbnailUrl = newThumb.url;
  }

  // Only update if there are changes
  if (Object.keys(updatePayload).length === 0) {
    return res.status(200).json(
      new apiResponse(200, 'No changes detected', formatVideo(video))
    );
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: updatePayload },
    { new: true }
  );

  res.status(200).json(
    new apiResponse(200, 'Video updated successfully', formatVideo(updatedVideo))
  );
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
    throw new NotFoundError('Video', videoId);
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You do not have permission to delete this video');
  }

  // Delete media from Cloudinary (best effort - don't fail if deletion fails)
  const deletePromises = [];
  if (video.url) {
    deletePromises.push(
      deleteFromCloudinary(video.url).catch((err) => {
        console.error('Failed to delete video from cloud storage:', err);
      })
    );
  }
  if (video.thumbnailUrl) {
    deletePromises.push(
      deleteFromCloudinary(video.thumbnailUrl).catch((err) => {
        console.error('Failed to delete thumbnail from cloud storage:', err);
      })
    );
  }

  // Remove video from all users' watch history
  deletePromises.push(
    User.updateMany(
      { watchHistory: video._id },
      { $pull: { watchHistory: video._id } }
    )
  );

  // Wait for all cleanup operations (don't block on failures)
  await Promise.allSettled(deletePromises);

  // Delete video document
  await Video.deleteOne({ _id: video._id });

  res.status(200).json(
    new apiResponse(200, 'Video deleted successfully', { videoId })
  );
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
    throw new NotFoundError('Video', videoId);
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You do not have permission to update this video');
  }

  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });

  res.status(200).json(
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
    throw new ValidationError('Search query is required', [
      { field: 'query', message: 'Search query cannot be empty' },
    ]);
  }

  const { page, limit } = getPaginationParams(req.query);
  const searchQuery = query.trim();

  // Use regex for case-insensitive search (text index can be used in future optimization)
  const matchStage = {
    isPublished: true,
    $or: [
      { title: { $regex: searchQuery, $options: 'i' } },
      { description: { $regex: searchQuery, $options: 'i' } },
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

  // Format videos and use standardized paginated response
  const formattedVideos = (result.docs || []).map(formatVideo);
  const response = apiResponse.paginated(
    200,
    'Videos searched successfully',
    {
      ...result,
      docs: formattedVideos,
    }
  );

  res.status(200).json(response);
});

/**
 * Get videos by owner
 * @route GET /api/v1/videos/user/:userId
 * @access Public (only published) / Private (owner can see all)
 */
const getVideosByOwner = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  validateObjectId(userId, 'userId');

  const { page, limit } = getPaginationParams(req.query);
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

  // Format videos and use standardized paginated response
  const formattedVideos = (result.docs || []).map(formatVideo);
  const response = apiResponse.paginated(
    200,
    'Owner videos fetched successfully',
    {
      ...result,
      docs: formattedVideos,
    }
  );

  res.status(200).json(response);
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
    throw new NotFoundError('Video', videoId);
  }

  if (!video.isPublished) {
    throw new ForbiddenError('Cannot add unpublished video to watch history');
  }

  // Check if video is already in watch history to prevent duplicate view counts
  const alreadyInHistory = req.user.watchHistory?.some(
    (v) => v.toString() === videoId.toString()
  );

  // Only increment views if this is the first time user watches
  if (!alreadyInHistory) {
    // Increment views atomically
    await Video.findByIdAndUpdate(
      videoId,
      { $inc: { views: 1 } },
      { new: false }
    );

    // Add to watch history
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { watchHistory: videoId } },
      { new: true }
    );
  }

  res.status(200).json(
    new apiResponse(200, 'Video added to watch history successfully', {
      videoId,
      viewCounted: !alreadyInHistory,
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
