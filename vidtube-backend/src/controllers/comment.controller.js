// ============================================
// IMPORTS & DEPENDENCIES
// ============================================
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';

// Models
import Video from '../models/video.model.js';
import Comment from '../models/comment.model.js';
import Notification from '../models/notification.model.js';

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

/**
 * Validate comment content
 * @param {string} content
 */
const validateCommentContent = (content) => {
  if (!content || typeof content !== 'string' || !content.trim()) {
    throw new apiError(400, 'Comment content is required');
  }
  if (content.trim().length > 1000) {
    throw new apiError(400, 'Comment content must be at most 1000 characters');
  }
};

// ============================================
// COMMENT MANAGEMENT
// ============================================

/**
 * Add a comment to a video
 * @route POST /api/v1/comments/:videoId
 * @access Private
 */
const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content, parent } = req.body;

  validateObjectId(videoId, 'videoId');
  validateCommentContent(content);

  const video = await Video.findById(videoId);
  if (!video || !video.isPublished) {
    throw new apiError(404, 'Video not found or not published');
  }

  // If parent is provided, validate it exists
  let parentComment = null;
  if (parent) {
    validateObjectId(parent, 'parent');
    parentComment = await Comment.findById(parent);
    if (!parentComment) {
      throw new apiError(404, 'Parent comment not found');
    }
    // Ensure parent comment belongs to the same video
    if (parentComment.video.toString() !== videoId) {
      throw new apiError(400, 'Parent comment does not belong to this video');
    }
  }

  const comment = await Comment.create({
    content: content.trim(),
    video: videoId,
    owner: req.user._id,
    parent: parent || null,
  });

  // Create notifications
  if (parentComment) {
    // Reply to comment - notify the parent comment owner
    if (parentComment.owner.toString() !== req.user._id.toString()) {
      try {
        await Notification.create({
          recipient: parentComment.owner,
          type: 'comment',
          title: 'New Reply',
          message: `${req.user.fullName} replied to your comment`,
          relatedVideo: videoId,
          relatedUser: req.user._id,
        });
      } catch (notifError) {
        console.error('Failed to create reply notification:', notifError);
      }
    }
  } else {
    // Top-level comment - notify the video owner (don't notify self)
    if (video.owner.toString() !== req.user._id.toString()) {
      try {
        await Notification.create({
          recipient: video.owner,
          type: 'comment',
          title: 'New Comment',
          message: `${req.user.fullName} commented on your video`,
          relatedVideo: videoId,
          relatedUser: req.user._id,
        });
      } catch (notifError) {
        console.error('Failed to create comment notification:', notifError);
      }
    }
  }

  // Return comment with owner details
  const [createdComment] = await Comment.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(comment._id) } },
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
  ]);

  res
    .status(201)
    .json(
      new apiResponse(
        201,
        'Comment added successfully',
        createdComment || comment
      )
    );
});

/**
 * Update user's own comment
 * @route PATCH /api/v1/comments/c/:commentId
 * @access Private
 */
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  validateObjectId(commentId, 'commentId');
  validateCommentContent(content);

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new apiError(404, 'Comment not found');
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new apiError(403, 'You are not allowed to update this comment');
  }

  comment.content = content.trim();
  await comment.save({ validateBeforeSave: true });

  res
    .status(200)
    .json(new apiResponse(200, 'Comment updated successfully', comment));
});

/**
 * Delete user's own comment
 * @route DELETE /api/v1/comments/c/:commentId
 * @access Private
 */
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  validateObjectId(commentId, 'commentId');

  const comment = await Comment.findById(commentId).populate('video');
  if (!comment) {
    throw new apiError(404, 'Comment not found');
  }

  // Allow deletion if user is comment owner OR video owner
  const isCommentOwner = comment.owner.toString() === req.user._id.toString();
  const isVideoOwner =
    comment.video.owner.toString() === req.user._id.toString();

  if (!isCommentOwner && !isVideoOwner) {
    throw new apiError(403, 'You are not allowed to delete this comment');
  }

  await Comment.deleteOne({ _id: comment._id });

  res.status(200).json(new apiResponse(200, 'Comment deleted successfully'));
});

// ============================================
// COMMENT RETRIEVAL
// ============================================

/**
 * Get paginated comments for a video
 * @route GET /api/v1/comments/:videoId
 * @access Public (only for published videos)
 */
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  validateObjectId(videoId, 'videoId');

  const { page, limit } = getPaginationParams(req.query);

  // Ensure video exists and is published
  const video = await Video.findById(videoId).select('isPublished');
  if (!video || !video.isPublished) {
    throw new apiError(404, 'Video not found or not published');
  }

  const pipeline = [
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
        parent: null, // Only get top-level comments
      },
    },
    {
      $sort: {
        createdAt: -1,
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
      $lookup: {
        from: 'comments',
        let: { commentId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$parent', '$$commentId'] },
            },
          },
          {
            $sort: { createdAt: 1 },
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
            $lookup: {
              from: 'likes',
              localField: '_id',
              foreignField: 'comment',
              as: 'replyLikes',
            },
          },
          {
            $addFields: {
              owner: { $first: '$owner' },
              likes: { $size: '$replyLikes' },
              isLiked: {
                $in: [req.user?._id, '$replyLikes.likedBy'],
              },
            },
          },
        ],
        as: 'replies',
      },
    },
    {
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'comment',
        as: 'commentLikes',
      },
    },
    {
      $addFields: {
        owner: { $first: '$owner' },
        repliesCount: { $size: '$replies' },
        likes: { $size: '$commentLikes' },
        isLiked: {
          $in: [req.user?._id, '$commentLikes.likedBy'],
        },
      },
    },
  ];

  const aggregate = Comment.aggregate(pipeline);
  const result = await Comment.aggregatePaginate(aggregate, {
    page,
    limit,
  });

  res
    .status(200)
    .json(new apiResponse(200, 'Comments fetched successfully', result));
});

// ============================================
// EXPORTS
// ============================================

export { addComment, updateComment, deleteComment, getVideoComments };
