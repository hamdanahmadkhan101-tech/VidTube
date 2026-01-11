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
          $lookup: {
            from: 'subscriptions',
            localField: '_id',
            foreignField: 'channel',
            as: 'subscribers',
          },
        },
        {
          $addFields: {
            subscribersCount: { $size: '$subscribers' },
          },
        },
        {
          $project: {
            username: 1,
            fullName: 1,
            avatarUrl: 1,
            subscribersCount: 1,
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
  console.log('Upload started:', {
    body: req.body,
    files: req.files ? Object.keys(req.files) : 'no files'
  });

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

  console.log('File paths:', { videoPath, thumbnailPath });

  if (!videoPath) {
    throw new ValidationError('Video file is required', [
      { field: 'video', message: 'Video file is required' },
    ]);
  }

  try {
    console.log('Starting Cloudinary upload...');
    // Upload video to Cloudinary
    const videoUploadResult = await uploadOnCloudinary(videoPath);
    console.log('Video upload result:', videoUploadResult ? 'success' : 'failed');
    
    if (!videoUploadResult?.url) {
      throw new apiError(500, 'Video upload to cloud storage failed');
    }

    // Upload thumbnail if provided
    const thumbnailUploadResult = thumbnailPath
      ? await uploadOnCloudinary(thumbnailPath)
      : null;
    
    console.log('Creating video document...');
    const newVideo = await Video.create({
      title: validatedTitle,
      description: validatedDescription,
      videoformat: validatedFormat,
      duration: numericDuration,
      url: videoUploadResult.url,
      thumbnailUrl: thumbnailUploadResult?.url || '',
      owner: req.user._id,
    });

    console.log('Video created, fetching with owner details...');
    // Return video with populated owner details
    const [createdVideo] = await Video.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(newVideo._id) } },
      ...ownerLookupPipeline,
    ]);

    console.log('Upload completed successfully');
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
    console.error('Upload error:', error);
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
  const allowedSortFields = ['createdAt', 'views', 'title', 'trending'];
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
  ];

  // If sorting by trending, calculate engagement score
  if (req.query.sortBy === 'trending' || req.query.sortBy === 'views') {
    pipeline.push({
      $addFields: {
        // Calculate trending score: views * 0.5 + likes * 2 + comments * 3
        // More recent videos get a boost
        trendingScore: {
          $add: [
            { $multiply: ['$views', 0.5] },
            { $multiply: ['$likes', 2] },
            { $multiply: ['$commentsCount', 3] },
            // Recency boost: videos from last 7 days get bonus points
            {
              $cond: {
                if: {
                  $gte: [
                    '$createdAt',
                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  ],
                },
                then: 1000,
                else: 0,
              },
            },
          ],
        },
      },
    });
    // Sort by trending score when sortBy is 'views' or 'trending'
    if (req.query.sortBy === 'views') {
      pipeline.push({
        $sort: { trendingScore: -1, createdAt: -1 },
      });
    } else {
      pipeline.push({
        $sort: sortStage,
      });
    }
  } else {
    pipeline.push({
      $sort: sortStage,
    });
  }

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
    // Lookup subscriptions for checking if current user is subscribed
    {
      $lookup: {
        from: 'subscriptions',
        let: { ownerId: '$owner._id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$channel', '$$ownerId'] },
                  { $eq: ['$subscriber', currentUserId] },
                ],
              },
            },
          },
        ],
        as: 'subscriptionCheck',
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
        'owner.isSubscribed': { $gt: [{ $size: '$subscriptionCheck' }, 0] },
      },
    });
  } else {
    pipeline.push({
      $addFields: {
        likesCount: { $size: '$likes' },
        commentsCount: { $size: '$comments' },
        isLiked: false,
        'owner.isSubscribed': false,
      },
    });
  }

  pipeline.push({
    $project: {
      likes: 0,
      comments: 0,
      subscriptionCheck: 0,
    },
  });

  const [detailedVideo] = await Video.aggregate(pipeline);

  if (!detailedVideo) {
    throw new NotFoundError('Video', videoId);
  }

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

  // Use text search with scoring for better relevance
  const matchStage = {
    isPublished: true,
    $or: [
      { title: { $regex: escapedQuery, $options: 'i' } },
      { description: { $regex: escapedQuery, $options: 'i' } },
    ],
  };

  const pipeline = [
    { $match: matchStage },
    ...ownerLookupPipeline,
    // Add relevance score: title match scores higher than description
    {
      $addFields: {
        relevanceScore: {
          $add: [
            {
              $cond: {
                if: {
                  $regexMatch: {
                    input: '$title',
                    regex: escapedQuery,
                    options: 'i',
                  },
                },
                then: 10,
                else: 0,
              },
            },
            {
              $cond: {
                if: {
                  $regexMatch: {
                    input: '$description',
                    regex: escapedQuery,
                    options: 'i',
                  },
                },
                then: 5,
                else: 0,
              },
            },
            // Boost recent and popular videos
            { $multiply: ['$views', 0.001] },
            { $multiply: ['$likes', 0.01] },
          ],
        },
      },
    },
    { $sort: { relevanceScore: -1, createdAt: -1 } },
  ];

  const aggregate = Video.aggregate(pipeline);
  const result = await Video.aggregatePaginate(aggregate, {
    page,
    limit,
  });

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
    {
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'video',
        as: 'videoLikes',
      },
    },
    {
      $addFields: {
        likesCount: { $size: '$videoLikes' },
      },
    },
    {
      $project: {
        videoLikes: 0, // Remove the array after counting
      },
    },
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
  getSearchSuggestions,
  getVideosByOwner,

  // Video Interactions
  addVideoToWatchHistory,
};
