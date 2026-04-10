import mongoose from 'mongoose';

const userOwnerProjectionPipeline = [
  {
    $project: {
      username: 1,
      fullName: 1,
      avatarUrl: 1,
    },
  },
];

const buildCommentOwnerLookupStage = () => ({
  $lookup: {
    from: 'users',
    localField: 'owner',
    foreignField: '_id',
    as: 'owner',
    pipeline: userOwnerProjectionPipeline,
  },
});

const buildReplyOwnerLookupStage = () => ({
  $lookup: {
    from: 'users',
    localField: 'owner',
    foreignField: '_id',
    as: 'owner',
    pipeline: userOwnerProjectionPipeline,
  },
});

export const buildCreatedCommentPipeline = ({ commentId }) => [
  { $match: { _id: new mongoose.Types.ObjectId(commentId) } },
  buildCommentOwnerLookupStage(),
  {
    $addFields: {
      owner: { $first: '$owner' },
    },
  },
];

export const buildCommentDeletionTreePipeline = ({ commentId }) => [
  {
    $match: {
      _id: new mongoose.Types.ObjectId(commentId),
    },
  },
  {
    $graphLookup: {
      from: 'comments',
      startWith: '$_id',
      connectFromField: '_id',
      connectToField: 'parent',
      as: 'descendants',
    },
  },
  {
    $project: {
      idsToDelete: {
        $concatArrays: [['$_id'], '$descendants._id'],
      },
    },
  },
];

const buildRepliesLookupStage = ({ currentUserId }) => ({
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
      buildReplyOwnerLookupStage(),
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
            $in: [currentUserId || null, '$replyLikes.likedBy'],
          },
        },
      },
    ],
    as: 'replies',
  },
});

export const buildVideoCommentsPipeline = ({
  videoId,
  sortBy,
  currentUserId,
}) => [
  {
    $match: {
      video: new mongoose.Types.ObjectId(videoId),
      parent: null,
    },
  },
  buildCommentOwnerLookupStage(),
  buildRepliesLookupStage({ currentUserId }),
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
        $in: [currentUserId || null, '$commentLikes.likedBy'],
      },
      isOwnComment: {
        $eq: ['$owner._id', currentUserId || null],
      },
    },
  },
  {
    $addFields: {
      engagementScore: {
        $add: [{ $multiply: ['$likes', 2] }, '$repliesCount'],
      },
    },
  },
  {
    $sort:
      sortBy === 'top'
        ? { isOwnComment: -1, engagementScore: -1, createdAt: -1 }
        : { isOwnComment: -1, createdAt: -1 },
  },
];

export const buildCommentRepliesPipeline = ({ commentId, currentUserId }) => [
  {
    $match: {
      parent: new mongoose.Types.ObjectId(commentId),
    },
  },
  buildReplyOwnerLookupStage(),
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
        $in: [currentUserId || null, '$replyLikes.likedBy'],
      },
    },
  },
  {
    $project: {
      replyLikes: 0,
    },
  },
  {
    $sort: { createdAt: 1 },
  },
];
