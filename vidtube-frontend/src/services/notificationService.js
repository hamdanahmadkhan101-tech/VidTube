import httpClient from "./httpClient.js";

/**
 * Get user's notifications
 * @param {Object} params - { page, limit, unreadOnly }
 * @returns {Promise}
 */
export const getNotifications = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.unreadOnly) queryParams.append("unreadOnly", params.unreadOnly);

  return httpClient.get(`/notifications?${queryParams.toString()}`);
};

/**
 * Get unread notification count
 * @returns {Promise}
 */
export const getUnreadCount = () =>
  httpClient.get("/notifications/unread/count");

/**
 * Mark a notification as read
 * @param {string} notificationId
 * @returns {Promise}
 */
export const markAsRead = (notificationId) =>
  httpClient.patch(`/notifications/${notificationId}/read`);

/**
 * Mark all notifications as read
 * @returns {Promise}
 */
export const markAllAsRead = () => httpClient.patch("/notifications/read-all");

/**
 * Delete a notification
 * @param {string} notificationId
 * @returns {Promise}
 */
export const deleteNotification = (notificationId) =>
  httpClient.delete(`/notifications/${notificationId}`);

/**
 * Delete all notifications
 * @returns {Promise}
 */
export const deleteAllNotifications = () => httpClient.delete("/notifications");
