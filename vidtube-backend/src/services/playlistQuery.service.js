import mongoose from 'mongoose';

export const playlistOwnerLookupPipeline = [
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

export const buildUserPlaylistsQuery = ({
  ownerId,
  includePrivate,
  skip,
  limit,
}) => {
  const matchStage = {
    owner: new mongoose.Types.ObjectId(ownerId),
  };

  if (!includePrivate) {
    matchStage.isPublic = true;
  }

  const pipeline = [
    { $match: matchStage },
    ...playlistOwnerLookupPipeline,
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ];

  return { matchStage, pipeline };
};
