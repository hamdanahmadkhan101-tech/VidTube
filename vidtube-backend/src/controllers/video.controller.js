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
import { getPaginationParams, getSortParams } from '../utils/pagination.js';
import {
  validateObjectId,
  validateRequired,
  validateNumericRange,
  validateStringLength,
} from '../utils/validation.js';
import { formatVideo } from '../utils/formatters.js';

// Models
import Video from '../models/video.model.js';
import { User } from '../models/user.model.js';
import Like from '../models/like.model.js';
import Comment from '../models/comment.model.js';
import WatchHistoryEntry from '../models/watchHistoryEntry.model.js';
import WatchLaterEntry from '../models/watchLaterEntry.model.js';
import UserStatistic from '../models/userStatistic.model.js';

// Services
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from '../utils/cloudinary.js';
import {
  ownerLookupPipeline,
  buildPublishedVideosPipeline,
  buildVideoDetailsPipeline,
  buildVideoSearchPipeline,
  buildVideoTextSearchPipeline,
  buildOwnerVideosPipeline,
  buildShortsFeedPipeline,
} from '../services/queries/videoQuery.service.js';

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
  validateRequired({ title, videoformat, duration }, [
    'title',
    'videoformat',
    'duration',
  ]);

  // Validate string fields
  const validatedTitle = validateStringLength(title, 1, 200, 'title');
  const validatedDescription = description
    ? validateStringLength(description, 0, 5000, 'description')
    : '';
  const validatedFormat = validateStringLength(
    videoformat,
    1,
    20,
    'videoformat'
  );

  // Validate duration
  const numericDuration = validateNumericRange(
    duration,
    0.01,
    86400,
    'duration'
  );

  const videoPath = req.files?.video?.[0]?.path ?? null;
  const thumbnailPath = req.files?.thumbnail?.[0]?.path ?? null;

  if (!videoPath) {
    throw new ValidationError('Video file is required', [
      { field: 'video', message: 'Video file is required' },
    ]);
  }

  try {
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

    res
      .status(201)
      .json(
        new apiResponse(
          201,
          'Video uploaded successfully',
          formatVideo(createdVideo || newVideo)
        )
      );
  } catch (error) {
    if (error.code === 'UPLOAD_TIMEOUT') {
      throw new apiError(408, error.message);
    }

    if (error.code === 'CLOUDINARY_ERROR') {
      throw new apiError(502, 'Cloud storage service error. Please try again.');
    }

    throw error;
  }
});

/**
 * Get paginated list of published videos
 * @route GET /api/v1/videos
 * @access Public
 */
const getAllVideos = asyncHandler(async (req, res) => {
  const { page, limit } = getPaginationParams(req.query);
  const sortBy = req.query.sortBy;
  const allowedSortFields = ['createdAt', 'views', 'title', 'trending'];
  const { sortStage } = getSortParams(
    sortBy,
    req.query.sortType,
    allowedSortFields
  );

  const pipeline = buildPublishedVideosPipeline({ sortBy, sortStage });

  const aggregate = Video.aggregate(pipeline);
  const result = await Video.aggregatePaginate(aggregate, {
    page,
    limit,
  });

  // Format videos and use standardized paginated response
  const formattedVideos = (result.docs || []).map(formatVideo);
  const response = apiResponse.paginated(200, 'Videos fetched successfully', {
    ...result,
    docs: formattedVideos,
  });

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
    throw new ForbiddenError(
      'This video is not published and cannot be accessed'
    );
  }

  const currentUserId = req.user?._id
    ? new mongoose.Types.ObjectId(req.user._id)
    : null;

  const pipeline = buildVideoDetailsPipeline({
    videoId,
    currentUserId,
  });

  const [detailedVideoData] = await Video.aggregate(pipeline);

  if (!detailedVideoData) {
    throw new NotFoundError('Video', videoId);
  }

  let isLiked = false;
  let isInWatchLater = false;
  if (currentUserId) {
    const [likeExists, watchLaterExists] = await Promise.all([
      Like.exists({
        video: new mongoose.Types.ObjectId(videoId),
        likedBy: currentUserId,
      }),
      WatchLaterEntry.exists({
        user: currentUserId,
        video: new mongoose.Types.ObjectId(videoId),
      }),
    ]);
    isLiked = Boolean(likeExists);
    isInWatchLater = Boolean(watchLaterExists);
  }

  const detailedVideo = {
    ...detailedVideoData,
    likesCount: detailedVideoData?.likesCount || 0,
    commentsCount: detailedVideoData?.commentsCount || 0,
    isLiked,
    isInWatchLater,
  };

  res
    .status(200)
    .json(
      new apiResponse(
        200,
        'Video fetched successfully',
        formatVideo(detailedVideo)
      )
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
    return res
      .status(200)
      .json(new apiResponse(200, 'No changes detected', formatVideo(video)));
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: updatePayload },
    { new: true }
  );

  res
    .status(200)
    .json(
      new apiResponse(
        200,
        'Video updated successfully',
        formatVideo(updatedVideo)
      )
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
  deletePromises.push(WatchHistoryEntry.deleteMany({ video: video._id }));
  deletePromises.push(WatchLaterEntry.deleteMany({ video: video._id }));

  // Legacy cleanup for embedded watch history arrays (safe no-op if absent)
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

  res
    .status(200)
    .json(new apiResponse(200, 'Video deleted successfully', { videoId }));
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
  const { q, query } = req.query;
  const searchTerm = q || query; // Support both 'q' and 'query' parameters

  if (!searchTerm || !searchTerm.trim()) {
    throw new ValidationError('Search query is required', [
      { field: 'q', message: 'Search query cannot be empty' },
    ]);
  }

  const { page, limit } = getPaginationParams(req.query);
  const searchQuery = searchTerm.trim();

  // Escape special regex characters for safe search
  const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const executeSearch = async (pipelineBuilder) => {
    const pipeline = pipelineBuilder();
    const aggregate = Video.aggregate(pipeline);
    return Video.aggregatePaginate(aggregate, {
      page,
      limit,
    });
  };

  const isTextSearchIndexError = (error) => {
    const message = `${error?.message || ''}`.toLowerCase();
    return (
      error?.code === 27 ||
      message.includes('text index required') ||
      message.includes('index for $text')
    );
  };

  let result;

  try {
    result = await executeSearch(() =>
      buildVideoTextSearchPipeline({ searchQuery })
    );

    if (!result?.docs?.length) {
      result = await executeSearch(() =>
        buildVideoSearchPipeline({ escapedQuery })
      );
    }
  } catch (error) {
    if (!isTextSearchIndexError(error)) {
      throw error;
    }

    result = await executeSearch(() =>
      buildVideoSearchPipeline({ escapedQuery })
    );
  }

  // Format videos and use standardized paginated response
  const formattedVideos = (result.docs || []).map(formatVideo);
  const response = apiResponse.paginated(200, 'Videos searched successfully', {
    ...result,
    docs: formattedVideos,
  });

  res.status(200).json(response);
});

/**
 * Get search suggestions
 * @route GET /api/v1/videos/suggestions
 * @access Public
 */
const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query || !query.trim()) {
    // Return popular search terms/topics
    const suggestions = [
      'gaming',
      'music',
      'tutorial',
      'vlog',
      'cooking',
      'travel',
      'technology',
      'sports',
      'comedy',
      'education',
    ];
    return res
      .status(200)
      .json(new apiResponse(200, 'Default suggestions', suggestions));
  }

  const searchQuery = query.trim();
  const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const limit = 10;

  // Get matching video titles
  const videos = await Video.find({
    isPublished: true,
    title: { $regex: escapedQuery, $options: 'i' },
  })
    .select('title')
    .limit(limit)
    .lean();

  // Extract unique suggestions
  const suggestions = [...new Set(videos.map((v) => v.title))];

  res
    .status(200)
    .json(
      new apiResponse(200, 'Suggestions fetched successfully', suggestions)
    );
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
  const includeUnpublished =
    req.user && req.user._id && req.user._id.toString() === userId.toString();

  const pipeline = buildOwnerVideosPipeline({
    ownerId: userId,
    includeUnpublished,
  });

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

/**
 * Get shorts feed with cursor pagination
 * @route GET /api/v1/videos/shorts-feed
 * @access Public
 */
const getShortsFeed = asyncHandler(async (req, res) => {
  const { cursor, category } = req.query;
  const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 20);

  let cursorDate = null;
  if (cursor) {
    cursorDate = new Date(cursor);
    if (Number.isNaN(cursorDate.getTime())) {
      throw new ValidationError('Invalid cursor format', [
        { field: 'cursor', message: 'Cursor must be a valid ISO date string' },
      ]);
    }
  }

  const pipeline = buildShortsFeedPipeline({
    cursorDate,
    limit,
    category: category?.trim() || undefined,
  });

  const feedVideos = await Video.aggregate(pipeline);
  const hasMore = feedVideos.length > limit;
  const slicedVideos = hasMore ? feedVideos.slice(0, limit) : feedVideos;
  const formattedVideos = slicedVideos.map(formatVideo);

  if (req.user?._id && formattedVideos.length) {
    const videoIds = formattedVideos.map((video) => video._id);
    const watchLaterEntries = await WatchLaterEntry.find({
      user: req.user._id,
      video: { $in: videoIds },
    })
      .select('video')
      .lean();

    const watchLaterVideoIds = new Set(
      watchLaterEntries.map((entry) => entry.video.toString())
    );

    for (const video of formattedVideos) {
      video.isInWatchLater = watchLaterVideoIds.has(video._id.toString());
    }
  }

  const lastItem = formattedVideos[formattedVideos.length - 1] || null;

  res.status(200).json(
    new apiResponse(200, 'Shorts feed fetched successfully', {
      videos: formattedVideos,
      nextCursor: hasMore && lastItem?.createdAt ? lastItem.createdAt : null,
      hasMore,
    })
  );
});

/**
 * Toggle watch later status for a video
 * @route POST /api/v1/videos/:videoId/watch-later/toggle
 * @access Private
 */
const toggleWatchLater = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { source = 'watch-page' } = req.body || {};

  validateObjectId(videoId, 'videoId');

  const video = await Video.findById(videoId).select('_id isPublished');
  if (!video) {
    throw new NotFoundError('Video', videoId);
  }

  if (!video.isPublished) {
    throw new ForbiddenError('Cannot save unpublished video to watch later');
  }

  const existingEntry = await WatchLaterEntry.findOne({
    user: req.user._id,
    video: video._id,
  }).select('_id');

  if (existingEntry) {
    await WatchLaterEntry.deleteOne({ _id: existingEntry._id });

    return res.status(200).json(
      new apiResponse(200, 'Removed from watch later', {
        videoId,
        isInWatchLater: false,
        action: 'removed',
      })
    );
  }

  try {
    await WatchLaterEntry.create({
      user: req.user._id,
      video: video._id,
      source,
    });
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }
  }

  res.status(200).json(
    new apiResponse(200, 'Added to watch later', {
      videoId,
      isInWatchLater: true,
      action: 'added',
    })
  );
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
  const { source = 'watch-page' } = req.body || {};
  validateObjectId(videoId, 'videoId');

  const video = await Video.findById(videoId);
  if (!video) {
    throw new NotFoundError('Video', videoId);
  }

  if (!video.isPublished) {
    throw new ForbiddenError('Cannot add unpublished video to watch history');
  }

  const now = new Date();

  const historyUpdateResult = await WatchHistoryEntry.updateOne(
    {
      user: req.user._id,
      video: video._id,
    },
    {
      $set: {
        lastWatchedAt: now,
        source,
      },
      $setOnInsert: {
        firstWatchedAt: now,
        watchCount: 0,
      },
      $inc: {
        watchCount: 1,
      },
    },
    {
      upsert: true,
    }
  );

  const shouldCountView = historyUpdateResult.upsertedCount > 0;

  if (shouldCountView) {
    await Video.updateOne({ _id: video._id }, { $inc: { views: 1 } });

    await UserStatistic.updateOne(
      { user: req.user._id },
      {
        $set: {
          lastActiveAt: now,
        },
        $setOnInsert: {
          user: req.user._id,
        },
        $inc: {
          totalVideosWatched: 1,
        },
      },
      { upsert: true }
    );
  }

  // Legacy compatibility: keep embedded array up to date while old clients still rely on it.
  await User.updateOne(
    { _id: req.user._id, watchHistory: { $ne: video._id } },
    { $push: { watchHistory: video._id } }
  );

  res.status(200).json(
    new apiResponse(200, 'Video added to watch history successfully', {
      videoId,
      viewCounted: shouldCountView,
      source,
    })
  );
});

/**
 * Update user's watch progress for a video
 * @route PATCH /api/v1/videos/:videoId/watch-progress
 * @access Private
 */
const updateWatchProgress = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { progressSeconds, completed, source = 'watch-page' } = req.body;

  validateObjectId(videoId, 'videoId');

  const video = await Video.findById(videoId).select(
    '_id duration isPublished'
  );
  if (!video) {
    throw new NotFoundError('Video', videoId);
  }

  if (!video.isPublished) {
    throw new ForbiddenError('Cannot update progress for unpublished video');
  }

  const now = new Date();
  const safeProgress = Math.min(
    Math.max(Number(progressSeconds) || 0, 0),
    Math.max(video.duration || 0, 0)
  );
  const completionThreshold = Math.max(
    30,
    Math.floor((video.duration || 0) * 0.9)
  );
  const resolvedCompleted =
    completed !== undefined ? completed : safeProgress >= completionThreshold;

  const existingEntry = await WatchHistoryEntry.findOne({
    user: req.user._id,
    video: video._id,
  }).select('progressSeconds');

  const previousProgress = existingEntry?.progressSeconds || 0;
  const watchTimeDelta = Math.max(0, safeProgress - previousProgress);

  await WatchHistoryEntry.updateOne(
    {
      user: req.user._id,
      video: video._id,
    },
    {
      $set: {
        progressSeconds: safeProgress,
        completed: resolvedCompleted,
        lastWatchedAt: now,
        source,
      },
      $setOnInsert: {
        firstWatchedAt: now,
        watchCount: 1,
      },
    },
    {
      upsert: true,
    }
  );

  if (watchTimeDelta > 0) {
    await UserStatistic.updateOne(
      { user: req.user._id },
      {
        $set: {
          lastActiveAt: now,
        },
        $setOnInsert: {
          user: req.user._id,
        },
        $inc: {
          totalWatchTimeSeconds: Math.round(watchTimeDelta),
        },
      },
      { upsert: true }
    );
  }

  res.status(200).json(
    new apiResponse(200, 'Watch progress updated successfully', {
      videoId,
      progressSeconds: safeProgress,
      completed: resolvedCompleted,
      source,
    })
  );
});

/**
 * Batch update watch progress for multiple videos
 * @route POST /api/v1/videos/watch-progress/batch
 * @access Private
 */
const batchUpdateWatchProgress = asyncHandler(async (req, res) => {
  const { events } = req.body;

  if (!Array.isArray(events) || events.length === 0) {
    throw new ValidationError('At least one progress event is required', [
      { field: 'events', message: 'At least one progress event is required' },
    ]);
  }

  // Keep the latest event per video to minimize writes per scroll session.
  const latestEventsByVideoId = new Map();
  for (const event of events) {
    latestEventsByVideoId.set(event.videoId, event);
  }

  const dedupedEvents = Array.from(latestEventsByVideoId.values());
  const videoObjectIds = dedupedEvents.map(
    (event) => new mongoose.Types.ObjectId(event.videoId)
  );

  const [videos, existingEntries] = await Promise.all([
    Video.find({
      _id: { $in: videoObjectIds },
      isPublished: true,
    })
      .select('_id duration')
      .lean(),
    WatchHistoryEntry.find({
      user: req.user._id,
      video: { $in: videoObjectIds },
    })
      .select('video progressSeconds')
      .lean(),
  ]);

  const videoById = new Map(
    videos.map((video) => [video._id.toString(), video])
  );
  const previousProgressByVideoId = new Map(
    existingEntries.map((entry) => [
      entry.video.toString(),
      entry.progressSeconds || 0,
    ])
  );

  const now = new Date();
  const bulkOperations = [];
  let totalWatchTimeDelta = 0;
  let processedEvents = 0;
  let skippedEvents = 0;

  for (const event of dedupedEvents) {
    const video = videoById.get(event.videoId);
    if (!video) {
      skippedEvents += 1;
      continue;
    }

    const safeProgress = Math.min(
      Math.max(Number(event.progressSeconds) || 0, 0),
      Math.max(video.duration || 0, 0)
    );
    const completionThreshold = Math.max(
      30,
      Math.floor((video.duration || 0) * 0.9)
    );
    const resolvedCompleted =
      event.completed !== undefined
        ? event.completed
        : safeProgress >= completionThreshold;
    const previousProgress = previousProgressByVideoId.get(event.videoId) || 0;
    const watchTimeDelta = Math.max(0, safeProgress - previousProgress);

    totalWatchTimeDelta += watchTimeDelta;
    processedEvents += 1;

    bulkOperations.push({
      updateOne: {
        filter: {
          user: req.user._id,
          video: video._id,
        },
        update: {
          $set: {
            progressSeconds: safeProgress,
            completed: resolvedCompleted,
            lastWatchedAt: now,
            source: event.source || 'watch-page',
          },
          $setOnInsert: {
            firstWatchedAt: now,
            watchCount: 1,
          },
        },
        upsert: true,
      },
    });
  }

  if (bulkOperations.length) {
    await WatchHistoryEntry.bulkWrite(bulkOperations, { ordered: false });
  }

  if (totalWatchTimeDelta > 0) {
    await UserStatistic.updateOne(
      { user: req.user._id },
      {
        $set: {
          lastActiveAt: now,
        },
        $setOnInsert: {
          user: req.user._id,
        },
        $inc: {
          totalWatchTimeSeconds: Math.round(totalWatchTimeDelta),
        },
      },
      { upsert: true }
    );
  }

  res.status(200).json(
    new apiResponse(200, 'Watch progress batch updated successfully', {
      totalEvents: events.length,
      dedupedEvents: dedupedEvents.length,
      processedEvents,
      skippedEvents,
      totalWatchTimeSecondsAdded: Math.round(totalWatchTimeDelta),
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
  getSearchSuggestions,
  getVideosByOwner,
  getShortsFeed,
  toggleWatchLater,

  // Video Interactions
  addVideoToWatchHistory,
  updateWatchProgress,
  batchUpdateWatchProgress,
};
