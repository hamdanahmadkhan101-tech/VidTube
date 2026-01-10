import mongoose from 'mongoose';
import Video from '../models/video.model.js';
import { User } from '../models/user.model.js';
import { NotFoundError, ForbiddenError, ValidationError, apiError } from '../errors/index.js';
import { formatVideo } from '../utils/formatters.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

/**
 * Video Service
 * Contains all business logic for video operations
 */

/**
 * Build common owner lookup pipeline for aggregations
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

/**
 * Create a new video
 * @param {Object} videoData - Video data
 * @param {string} videoData.title - Video title
 * @param {string} videoData.description - Video description
 * @param {string} videoData.videoformat - Video format
 * @param {number} videoData.duration - Video duration in seconds
 * @param {string} videoData.url - Video URL from cloud storage
 * @param {string} videoData.thumbnailUrl - Thumbnail URL
 * @param {ObjectId} ownerId - Video owner ID
 * @returns {Promise<Object>} Created video with populated owner
 */
export const createVideo = async (videoData, ownerId) => {
  const newVideo = await Video.create({
    ...videoData,
    owner: ownerId,
  });

  // Return video with populated owner details
  const [createdVideo] = await Video.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(newVideo._id) } },
    ...ownerLookupPipeline,
  ]);

  return formatVideo(createdVideo || newVideo);
};

/**
 * Upload video and thumbnail to cloud storage
 * @param {string} videoPath - Local path to video file
 * @param {string} thumbnailPath - Local path to thumbnail file (optional)
 * @returns {Promise<{videoUrl: string, thumbnailUrl: string}>}
 */
export const uploadVideoFiles = async (videoPath, thumbnailPath = null) => {
  if (!videoPath) {
    throw new ValidationError('Video file is required', [
      { field: 'video', message: 'Video file is required' },
    ]);
  }

  const videoUploadResult = await uploadOnCloudinary(videoPath);
  if (!videoUploadResult?.url) {
    throw new apiError(500, 'Video upload to cloud storage failed');
  }

  const thumbnailUploadResult = thumbnailPath
    ? await uploadOnCloudinary(thumbnailPath)
    : null;

  return {
    videoUrl: videoUploadResult.url,
    thumbnailUrl: thumbnailUploadResult?.url || '',
  };
};

/**
 * Get video by ID with engagement metrics
 * @param {string} videoId - Video ID
 * @param {ObjectId} currentUserId - Current user ID (optional)
 * @returns {Promise<Object>} Video with engagement metrics
 */
export const getVideoById = async (videoId, currentUserId = null) => {
  const video = await Video.findById(videoId);
  if (!video) {
    throw new NotFoundError('Video', videoId);
  }

  const currentUserIdObj = currentUserId
    ? new mongoose.Types.ObjectId(currentUserId)
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
  if (currentUserIdObj) {
    pipeline.push({
      $addFields: {
        likesCount: { $size: '$likes' },
        commentsCount: { $size: '$comments' },
        isLiked: {
          $in: [currentUserIdObj, '$likes.likedBy'],
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

  return formatVideo(detailedVideo);
};

/**
 * Check if user owns video
 * @param {ObjectId} videoId - Video ID
 * @param {ObjectId} userId - User ID
 * @returns {Promise<boolean>}
 */
export const checkVideoOwnership = async (videoId, userId) => {
  const video = await Video.findById(videoId);
  if (!video) {
    throw new NotFoundError('Video', videoId);
  }

  return video.owner.toString() === userId.toString();
};

/**
 * Get paginated videos
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {Object} options.sortStage - Sort stage for aggregation
 * @param {Object} options.matchStage - Match stage for filtering
 * @returns {Promise<Object>} Paginated video results
 */
export const getPaginatedVideos = async ({ page, limit, sortStage, matchStage = {} }) => {
  const pipeline = [
    {
      $match: {
        isPublished: true,
        ...matchStage,
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

  // Format all videos
  const formattedVideos = (result.docs || []).map(formatVideo);

  return {
    ...result,
    docs: formattedVideos,
  };
};

/**
 * Search videos by query
 * @param {string} searchQuery - Search query string
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated search results
 */
export const searchVideos = async (searchQuery, page, limit) => {
  const matchStage = {
    isPublished: true,
    $or: [
      { title: { $regex: searchQuery, $options: 'i' } },
      { description: { $regex: searchQuery, $options: 'i' } },
    ],
  };

  return getPaginatedVideos({
    page,
    limit,
    sortStage: { createdAt: -1 },
    matchStage,
  });
};

/**
 * Get videos by owner
 * @param {ObjectId} userId - Owner user ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {boolean} includeUnpublished - Include unpublished videos (owner only)
 * @returns {Promise<Object>} Paginated video results
 */
export const getVideosByOwner = async (userId, page, limit, includeUnpublished = false) => {
  const matchStage = {
    owner: new mongoose.Types.ObjectId(userId),
  };

  if (!includeUnpublished) {
    matchStage.isPublished = true;
  }

  return getPaginatedVideos({
    page,
    limit,
    sortStage: { createdAt: -1 },
    matchStage,
  });
};

/**
 * Update video details
 * @param {string} videoId - Video ID
 * @param {Object} updateData - Update data
 * @param {ObjectId} userId - User ID (for ownership check)
 * @returns {Promise<Object>} Updated video
 */
export const updateVideo = async (videoId, updateData, userId) => {
  const video = await Video.findById(videoId);
  if (!video) {
    throw new NotFoundError('Video', videoId);
  }

  if (video.owner.toString() !== userId.toString()) {
    throw new ForbiddenError('You do not have permission to update this video');
  }

  const updatePayload = {};
  if (updateData.title !== undefined) {
    updatePayload.title = updateData.title;
  }
  if (updateData.description !== undefined) {
    updatePayload.description = updateData.description;
  }
  if (updateData.thumbnailUrl !== undefined) {
    updatePayload.thumbnailUrl = updateData.thumbnailUrl;
  }

  if (Object.keys(updatePayload).length === 0) {
    // No changes, return current video
    const [currentVideo] = await Video.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
      ...ownerLookupPipeline,
    ]);
    return formatVideo(currentVideo || video);
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: updatePayload },
    { new: true }
  );

  // Return updated video with populated owner
  const [formattedVideo] = await Video.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
    ...ownerLookupPipeline,
  ]);

  return formatVideo(formattedVideo || updatedVideo);
};

/**
 * Delete video and clean up related data
 * @param {string} videoId - Video ID
 * @param {ObjectId} userId - User ID (for ownership check)
 * @returns {Promise<void>}
 */
export const deleteVideo = async (videoId, userId) => {
  const video = await Video.findById(videoId);
  if (!video) {
    throw new NotFoundError('Video', videoId);
  }

  if (video.owner.toString() !== userId.toString()) {
    throw new ForbiddenError('You do not have permission to delete this video');
  }

  // Delete media from Cloudinary (best effort)
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

  // Wait for all cleanup operations
  await Promise.allSettled(deletePromises);

  // Delete video document
  await Video.deleteOne({ _id: video._id });
};

/**
 * Toggle video publish status
 * @param {string} videoId - Video ID
 * @param {ObjectId} userId - User ID (for ownership check)
 * @returns {Promise<Object>} Updated video status
 */
export const togglePublishStatus = async (videoId, userId) => {
  const video = await Video.findById(videoId);
  if (!video) {
    throw new NotFoundError('Video', videoId);
  }

  if (video.owner.toString() !== userId.toString()) {
    throw new ForbiddenError('You do not have permission to update this video');
  }

  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });

  return {
    videoId: video._id,
    isPublished: video.isPublished,
  };
};

/**
 * Add video to watch history and increment view count
 * @param {string} videoId - Video ID
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Object>} Result with view count info
 */
export const addVideoToWatchHistory = async (videoId, userId) => {
  const video = await Video.findById(videoId);
  if (!video) {
    throw new NotFoundError('Video', videoId);
  }

  if (!video.isPublished) {
    throw new ForbiddenError('Cannot add unpublished video to watch history');
  }

  // Check if video is already in watch history
  const user = await User.findById(userId);
  const alreadyInHistory = user.watchHistory?.some(
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
      userId,
      { $push: { watchHistory: videoId } },
      { new: true }
    );
  }

  return {
    videoId,
    viewCounted: !alreadyInHistory,
  };
};

/**
 * Export owner lookup pipeline for use in controllers if needed
 */
export { ownerLookupPipeline };
