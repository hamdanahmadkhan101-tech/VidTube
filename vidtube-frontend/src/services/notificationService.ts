import apiClient from "./apiClient";
import type { ApiResponse, PaginatedResponse, Notification } from "../types";

type NotificationListData = {
  notifications?: Notification[];
  pagination?: PaginatedResponse<Notification>["pagination"];
};

export const notificationService = {
  // Get user notifications
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<PaginatedResponse<Notification>> => {
    const response = await apiClient.get<ApiResponse<NotificationListData>>(
      "/notifications",
      {
        params,
      },
    );
    // Backend returns { data: { notifications: [...], pagination: {...} } }
    const data = response.data.data || {};
    return {
      docs: data.notifications || [],
      pagination: data.pagination || {
        page: 1,
        limit: 20,
        totalDocs: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<void> => {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch("/notifications/read-all");
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  // Get unread count
  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<{ count: number }>>(
      "/notifications/unread/count",
    );
    const rawCount = response.data.data?.count;
    const parsedCount =
      typeof rawCount === "number" && Number.isFinite(rawCount)
        ? rawCount
        : Number(rawCount ?? 0);

    return Number.isFinite(parsedCount) && parsedCount > 0
      ? Math.floor(parsedCount)
      : 0;
  },
};
