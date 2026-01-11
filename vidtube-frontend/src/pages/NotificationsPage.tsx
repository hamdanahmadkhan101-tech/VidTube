import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bell,
  Check,
  Heart,
  MessageCircle,
  UserPlus,
  Video,
  Loader2,
} from "lucide-react";
import { notificationService } from "../services/notificationService.ts";
import { formatRelativeTime } from "../utils/helpers";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export const NotificationsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", page],
    queryFn: () => notificationService.getNotifications({ page, limit: 20 }),
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      toast.success("All notifications marked as read");
    },
  });

  const notifications = data?.docs || [];
  const hasNextPage = data?.pagination?.hasNextPage;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-5 h-5 text-red-500" />;
      case "comment":
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case "subscription":
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case "upload":
        return <Video className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationText = (notification: any) => {
    const userName =
      notification.sender?.fullName ||
      notification.relatedUser?.fullName ||
      "Someone";

    if (notification.message) {
      if (notification.message.toLowerCase().includes(userName.toLowerCase())) {
        return notification.message;
      }
      return `${userName} ${notification.message}`;
    }

    switch (notification.type) {
      case "like":
        return `${userName} liked your video`;
      case "comment":
        return `${userName} commented on your video`;
      case "subscription":
        return `${userName} subscribed to your channel`;
      case "upload":
        return `${userName} uploaded a new video`;
      default:
        return "New notification";
    }
  };

  const getNotificationLink = (notification: any) => {
    if (notification.relatedVideo?._id) {
      return `/watch/${notification.relatedVideo._id}`;
    }
    if (notification.video?._id) {
      return `/watch/${notification.video._id}`;
    }
    if (notification.type === "subscription") {
      const username =
        notification.sender?.username || notification.relatedUser?.username;
      if (username) return `/channel/${username}`;
    }
    return "#";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Bell className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-text-secondary">
                  {unreadCount} unread notification
                  {unreadCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card hover:bg-surface-hover text-text-primary transition-all"
            >
              <Check className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="glass-card divide-y divide-white/5">
          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
          ) : notifications.length > 0 ? (
            <>
              {notifications.map((notification) => (
                <Link
                  key={notification._id}
                  to={getNotificationLink(notification)}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsReadMutation.mutate(notification._id);
                    }
                  }}
                  className={`flex items-start gap-4 p-4 hover:bg-surface transition-colors ${
                    !notification.isRead ? "bg-surface/50" : ""
                  }`}
                >
                  {/* Avatar */}
                  <img
                    src={
                      notification.sender?.avatarUrl ||
                      notification.sender?.avatar ||
                      (notification as any).relatedUser?.avatarUrl ||
                      (notification as any).relatedUser?.avatar ||
                      "/default-avatar.jpg"
                    }
                    alt={
                      notification.sender?.fullName ||
                      (notification as any).relatedUser?.fullName ||
                      "User"
                    }
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-text-primary">
                          {getNotificationText(notification)}
                        </p>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary-500 rounded-full mt-1" />
                        )}
                      </div>
                    </div>

                    {(notification.relatedVideo || notification.video) && (
                      <p className="text-xs text-text-secondary truncate">
                        {notification.relatedVideo?.title ||
                          notification.video?.title}
                      </p>
                    )}
                    <p className="text-xs text-text-muted mt-1">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}

              {/* Load More */}
              {hasNextPage && (
                <div className="p-4">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl glass-card hover:bg-surface-hover text-text-primary transition-all font-medium"
                  >
                    {isLoading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center">
              <Bell className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No notifications yet
              </h3>
              <p className="text-text-secondary">
                When you get notifications, they'll show up here
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default NotificationsPage;
