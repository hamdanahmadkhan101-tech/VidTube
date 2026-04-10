export const buildNotificationsMatchStage = ({ recipientId, unreadOnly }) => {
  const matchStage = { recipient: recipientId };

  if (unreadOnly === 'true') {
    matchStage.isRead = false;
  }

  return matchStage;
};
