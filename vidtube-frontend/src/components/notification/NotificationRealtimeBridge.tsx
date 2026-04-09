import React, { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import {
  connectNotificationSocket,
  disconnectNotificationSocket,
  getNotificationSocket,
  type RealtimeNotificationPayload,
} from "../../services/socketService";

type PersistedAuthStorage = {
  state?: {
    user?: {
      accessToken?: string;
    };
  };
};

const getStoredAccessToken = () => {
  try {
    const raw = localStorage.getItem("auth-storage");
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedAuthStorage;
    return parsed.state?.user?.accessToken || null;
  } catch {
    return null;
  }
};

export const NotificationRealtimeBridge: React.FC = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectNotificationSocket();
      return;
    }

    const accessToken = getStoredAccessToken();
    if (!accessToken) {
      return;
    }

    const socket = connectNotificationSocket(accessToken);
    if (!socket) {
      return;
    }

    const receivedNotificationIds = new Set<string>();
    let syncTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleSync = () => {
      if (syncTimer) {
        return;
      }

      syncTimer = setTimeout(() => {
        syncTimer = null;
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      }, 300);
    };

    const syncNotificationQueries = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    };

    const handleNewNotification = (payload: RealtimeNotificationPayload) => {
      if (payload?.notificationId) {
        if (receivedNotificationIds.has(payload.notificationId)) {
          return;
        }

        receivedNotificationIds.add(payload.notificationId);
        if (receivedNotificationIds.size > 200) {
          const [first] = receivedNotificationIds;
          if (first) {
            receivedNotificationIds.delete(first);
          }
        }
      }

      if (typeof payload?.unreadCount === "number") {
        queryClient.setQueryData(["unreadCount"], payload.unreadCount);
      } else {
        scheduleSync();
      }

      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    const handleReconnect = () => {
      syncNotificationQueries();
    };

    const manager = socket.io;

    socket.on("connect", syncNotificationQueries);
    socket.on("notification:new", handleNewNotification);
    manager.on("reconnect", handleReconnect);

    return () => {
      socket.off("connect", syncNotificationQueries);
      socket.off("notification:new", handleNewNotification);
      manager.off("reconnect", handleReconnect);

      if (syncTimer) {
        clearTimeout(syncTimer);
      }

      const activeSocket = getNotificationSocket();
      if (activeSocket && !isAuthenticated) {
        disconnectNotificationSocket();
      }
    };
  }, [isAuthenticated, user?._id, queryClient]);

  return null;
};
