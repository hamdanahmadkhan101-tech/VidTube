import mongoose from 'mongoose';

export const buildCurrentUserProfilePipeline = ({ userId }) => [
  {
    $match: { _id: new mongoose.Types.ObjectId(userId) },
  },
  {
    $lookup: {
      from: 'userpreferences',
      localField: '_id',
      foreignField: 'user',
      as: 'preferenceDoc',
    },
  },
  {
    $lookup: {
      from: 'userstatistics',
      localField: '_id',
      foreignField: 'user',
      as: 'statisticDoc',
    },
  },
  {
    $lookup: {
      from: 'subscriptions',
      localField: '_id',
      foreignField: 'channel',
      as: 'subscribers',
    },
  },
  {
    $lookup: {
      from: 'subscriptions',
      localField: '_id',
      foreignField: 'subscriber',
      as: 'subscribedTo',
    },
  },
  {
    $addFields: {
      preferences: {
        $ifNull: [{ $first: '$preferenceDoc' }, '$preferences'],
      },
      statistics: {
        $ifNull: [{ $first: '$statisticDoc' }, '$statistics'],
      },
      subscribersCount: { $size: '$subscribers' },
      subscribedToCount: { $size: '$subscribedTo' },
    },
  },
  {
    $project: {
      password: 0,
      refreshTokens: 0,
      subscribers: 0,
      subscribedTo: 0,
      preferenceDoc: 0,
      statisticDoc: 0,
      'preferences._id': 0,
      'preferences.user': 0,
      'preferences.createdAt': 0,
      'preferences.updatedAt': 0,
      'statistics._id': 0,
      'statistics.user': 0,
      'statistics.createdAt': 0,
      'statistics.updatedAt': 0,
    },
  },
];

export const buildChannelProfilePipeline = ({ username, viewerUserId }) => [
  {
    $match: {
      username: username.toLowerCase(),
    },
  },
  {
    $lookup: {
      from: 'subscriptions',
      localField: '_id',
      foreignField: 'channel',
      as: 'subscribers',
    },
  },
  {
    $lookup: {
      from: 'subscriptions',
      localField: '_id',
      foreignField: 'subscriber',
      as: 'subscribedTo',
    },
  },
  {
    $lookup: {
      from: 'videos',
      localField: '_id',
      foreignField: 'owner',
      as: 'videos',
    },
  },
  {
    $addFields: {
      subscribersCount: {
        $size: '$subscribers',
      },
      channelsSubscribedToCount: {
        $size: '$subscribedTo',
      },
      videosCount: {
        $size: '$videos',
      },
      isSubscribed: {
        $in: [viewerUserId, '$subscribers.subscriber'],
      },
    },
  },
  {
    $project: {
      fullName: 1,
      username: 1,
      avatarUrl: 1,
      coverUrl: 1,
      bio: 1,
      createdAt: 1,
      subscribersCount: 1,
      channelsSubscribedToCount: 1,
      videosCount: 1,
      isSubscribed: 1,
    },
  },
];

export const buildWatchHistoryPipeline = ({ userId, skip, limit }) => [
  {
    $match: {
      user: new mongoose.Types.ObjectId(userId),
    },
  },
  {
    $sort: {
      lastWatchedAt: -1,
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
            owner: {
              $first: '$owner',
            },
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
            url: 1,
            thumbnailUrl: 1,
            duration: 1,
            views: 1,
            createdAt: 1,
            owner: 1,
          },
        },
      ],
    },
  },
  {
    $unwind: {
      path: '$video',
      preserveNullAndEmptyArrays: false,
    },
  },
  {
    $addFields: {
      watchState: {
        progressSeconds: '$progressSeconds',
        completed: '$completed',
        watchCount: '$watchCount',
        lastWatchedAt: '$lastWatchedAt',
      },
    },
  },
  {
    $addFields: {
      'video.watchState': '$watchState',
    },
  },
  {
    $replaceRoot: {
      newRoot: '$video',
    },
  },
  {
    $facet: {
      videos: [{ $skip: skip }, { $limit: limit }],
      totalCount: [{ $count: 'count' }],
    },
  },
];
