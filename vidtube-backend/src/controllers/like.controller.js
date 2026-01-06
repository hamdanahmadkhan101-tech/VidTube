// ============================================
// IMPORTS & DEPENDENCIES
// ============================================
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';

// Models
import Video from '../models/video.model.js';
import Like from '../models/like.model.js';

// ============================================
// HELPER FUNCTIONS
// ============================================

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
 * Normalize pagination parameters
 * @param {Object} query
 * @returns {{ page: number, limit: number, skip: number }}
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
// VIDEO LIKE MANAGEMENT
// ============================================

/**
 * Toggle like status for a video
 * @route POST /api/v1/likes/toggle/v/:videoId
 * @access Private
 */
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  validateObjectId(videoId, 'videoId');

  const video = await Video.findById(videoId);
  if (!video || !video.isPublished) {
    throw new apiError(404, 'Video not found or not published');
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  let isLiked = false;

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    isLiked = false;
  } else {
    try {
      await Like.create({
        video: videoId,
        likedBy: req.user._id,
      });
      isLiked = true;
    } catch (error) {
      // Handle potential duplicate like due to race conditions
      if (error.code === 11000) {
        isLiked = true;
      } else {
        throw error;
      }
    }
  }

  // Get total likes count using aggregation
  const likesCountResult = await Like.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $count: 'count',
    },
  ]);

  const likesCount = likesCountResult[0]?.count || 0;

  res.status(200).json(
    new apiResponse(200, 'Video like status updated', {
      videoId,
      isLiked,
      likesCount,
    })
  );
});

/**
 * Get user's liked videos with pagination
 * @route GET /api/v1/likes/videos
 * @access Private
 */
const getLikedVideos = asyncHandler(async (req, res) => {
  const { page, limit } = getPaginationParams(req.query);

  const pipeline = [
    {
      $match: {
        likedBy: req.user._id,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'video',
        foreignField: '_id',
        as: 'video',
        pipeline: [
          {
            $match: {
              isPublished: true,
            },
          },
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
        ],
      },
    },
    {
      $unwind: '$video',
    },
    {
      $project: {
        _id: 0,
        likedAt: '$createdAt',
        video: 1,
      },
    },
  ];

  const aggregate = Like.aggregate(pipeline);
  const result = await Like.aggregatePaginate(aggregate, {
    page,
    limit,
  });

  res
    .status(200)
    .json(
      new apiResponse(200, 'Liked videos fetched successfully', result)
    );
});

// ============================================
// EXPORTS
// ============================================

export { toggleVideoLike, getLikedVideos };


