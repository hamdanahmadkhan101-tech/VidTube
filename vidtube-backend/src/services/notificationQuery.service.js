export const buildNotificationsMatchStage = ({ recipientId, unreadOnly }) => {
  const matchStage = { recipient: recipientId };

  if (unreadOnly === 'true') {
    matchStage.isRead = false;
  }

  return matchStage;
};

export const buildPaginationMeta = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});
