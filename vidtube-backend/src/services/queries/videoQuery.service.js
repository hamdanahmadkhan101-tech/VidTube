import mongoose from 'mongoose';

const DAYS_7_IN_MS = 7 * 24 * 60 * 60 * 1000;

export const ownerLookupPipeline = [
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

const buildTrendingScoreStage = () => ({
  $addFields: {
    trendingScore: {
      $add: [
        { $multiply: ['$views', 0.5] },
        { $multiply: ['$likesCount', 2] },
        { $multiply: ['$commentsCount', 3] },
        {
          $cond: {
            if: {
              $gte: ['$createdAt', new Date(Date.now() - DAYS_7_IN_MS)],
            },
            then: 1000,
            else: 0,
          },
        },
      ],
    },
  },
});

export const buildPublishedVideosPipeline = ({ sortBy, sortStage }) => {
  const pipeline = [
    {
      $match: {
        isPublished: true,
      },
    },
    ...ownerLookupPipeline,
  ];

  if (sortBy === 'trending') {
    pipeline.push(buildTrendingScoreStage());
  }

  pipeline.push({ $sort: sortStage });
  return pipeline;
};

export const buildVideoDetailsPipeline = ({ videoId, currentUserId }) => {
  const pipeline = [
    {
      $match: { _id: new mongoose.Types.ObjectId(videoId) },
    },
    ...ownerLookupPipeline,
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

  pipeline.push({
    $addFields: {
      'owner.isSubscribed': currentUserId
        ? { $gt: [{ $size: '$subscriptionCheck' }, 0] }
        : false,
    },
  });

  pipeline.push({
    $project: {
      subscriptionCheck: 0,
    },
  });

  return pipeline;
};

export const buildVideoSearchPipeline = ({ escapedQuery }) => {
  const matchStage = {
    isPublished: true,
    $or: [
      { title: { $regex: escapedQuery, $options: 'i' } },
      { description: { $regex: escapedQuery, $options: 'i' } },
    ],
  };

  return [
    { $match: matchStage },
    ...ownerLookupPipeline,
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
            { $multiply: ['$views', 0.001] },
            { $multiply: ['$likesCount', 0.01] },
          ],
        },
      },
    },
    { $sort: { relevanceScore: -1, createdAt: -1 } },
  ];
};

export const buildVideoTextSearchPipeline = ({ searchQuery }) => [
  {
    $match: {
      isPublished: true,
      $text: {
        $search: searchQuery,
      },
    },
  },
  ...ownerLookupPipeline,
  {
    $addFields: {
      textScore: {
        $meta: 'textScore',
      },
    },
  },
  {
    $addFields: {
      relevanceScore: {
        $add: [
          {
            $multiply: ['$textScore', 8],
          },
          {
            $multiply: ['$views', 0.001],
          },
          {
            $multiply: ['$likesCount', 0.01],
          },
        ],
      },
    },
  },
  {
    $sort: {
      relevanceScore: -1,
      createdAt: -1,
    },
  },
];

export const buildOwnerVideosPipeline = ({ ownerId, includeUnpublished }) => {
  const matchStage = {
    owner: new mongoose.Types.ObjectId(ownerId),
  };

  if (!includeUnpublished) {
    matchStage.isPublished = true;
  }

  return [
    { $match: matchStage },
    ...ownerLookupPipeline,
    {
      $addFields: {
        likesCount: { $ifNull: ['$likesCount', 0] },
        commentsCount: { $ifNull: ['$commentsCount', 0] },
      },
    },
    { $sort: { createdAt: -1 } },
  ];
};

export const buildShortsFeedPipeline = ({ cursorDate, limit, category }) => {
  const matchStage = {
    isPublished: true,
    privacy: 'public',
    duration: { $lte: 90 },
  };

  if (cursorDate) {
    matchStage.createdAt = { $lt: cursorDate };
  }

  if (category) {
    matchStage.category = category;
  }

  return [
    { $match: matchStage },
    ...ownerLookupPipeline,
    {
      $project: {
        title: 1,
        description: 1,
        url: 1,
        thumbnailUrl: 1,
        duration: 1,
        views: 1,
        likesCount: 1,
        category: 1,
        tags: 1,
        createdAt: 1,
        owner: 1,
      },
    },
    {
      $sort: {
        createdAt: -1,
        _id: -1,
      },
    },
    {
      $limit: limit + 1,
    },
  ];
};
