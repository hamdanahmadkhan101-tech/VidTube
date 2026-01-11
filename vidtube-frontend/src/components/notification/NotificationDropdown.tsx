import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  Check,
  Loader2,
  Heart,
  MessageCircle,
  UserPlus,
  Video,
} from "lucide-react";
import { notificationService } from "../../services/notificationService.ts";
import { formatRelativeTime } from "../../utils/helpers";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getNotifications({ page: 1, limit: 10 }),
    enabled: isOpen,
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

    // Use backend message if available, otherwise generate default
    if (notification.message) {
      // If message starts with username, return as is, otherwise prepend username
      if (notification.message.toLowerCase().includes(userName.toLowerCase())) {
        return notification.message;
      }
      return `${userName} ${notification.message}`;
    }

    // Fallback to type-based messages
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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
          />

          {/* Dropdown */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-96 bg-background-secondary backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 z-50 max-h-[600px] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold text-text-primary">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                    className="text-xs text-primary-500 hover:text-primary-400 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {isLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {notifications.map((notification) => (
                    <Link
                      key={notification._id}
                      to={getNotificationLink(notification)}
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsReadMutation.mutate(notification._id);
                        }
                        onClose();
                      }}
                      className={`flex items-start gap-3 p-4 hover:bg-surface transition-colors cursor-pointer ${
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
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <p className="text-sm text-text-primary flex-1">
                            {getNotificationText(notification)}
                          </p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        {(notification.relatedVideo || notification.video) && (
                          <p className="text-xs text-text-secondary truncate mt-1">
                            {notification.relatedVideo?.title ||
                              notification.video?.title}
                          </p>
                        )}
                        <p className="text-xs text-text-muted">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-secondary">No notifications yet</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-white/10">
                <Link
                  to="/notifications"
                  onClick={onClose}
                  className="block text-center text-sm text-primary-500 hover:text-primary-400 transition-colors"
                >
                  View all notifications
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
