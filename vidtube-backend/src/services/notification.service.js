import Notification from '../models/notification.model.js';
import { emitToUser } from '../socket/socket.server.js';

export const createNotificationAndEmit = async ({
  recipient,
  type,
  title,
  message,
  relatedVideo = null,
  relatedUser = null,
  metadata = {},
}) => {
  const notification = await Notification.create({
    recipient,
    type,
    title,
    message,
    relatedVideo,
    relatedUser,
    metadata,
  });

  const unreadCount = await Notification.countDocuments({
    recipient,
    isRead: false,
  });

  emitToUser(recipient, 'notification:new', {
    notificationId: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    unreadCount,
    createdAt: notification.createdAt,
  });

  return notification;
};
