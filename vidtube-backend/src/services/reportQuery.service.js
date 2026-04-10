export const reporterLookupPipeline = [
  {
    $lookup: {
      from: 'users',
      localField: 'reportedBy',
      foreignField: '_id',
      as: 'reportedBy',
      pipeline: [
        {
          $project: {
            username: 1,
            fullName: 1,
          },
        },
      ],
    },
  },
  {
    $addFields: {
      reportedBy: { $first: '$reportedBy' },
    },
  },
];

export const buildReportsListPipeline = ({ matchStage, skip, limit }) => [
  { $match: matchStage },
  ...reporterLookupPipeline,
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
