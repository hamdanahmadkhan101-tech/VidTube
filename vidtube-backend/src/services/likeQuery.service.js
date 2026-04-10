import mongoose from 'mongoose';

export const buildLikedVideosPipeline = ({ userId }) => [
  {
    $match: {
      likedBy: userId,
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

export const buildCommentLikesCountPipeline = ({ commentId }) => [
  {
    $match: {
      comment: new mongoose.Types.ObjectId(commentId),
    },
  },
  {
    $count: 'count',
  },
];
