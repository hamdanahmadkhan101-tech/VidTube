import Header from "../../components/layout/Header.jsx";
import ProtectedRoute from "../../components/common/ProtectedRoute.jsx";
import { Bell } from "lucide-react";

import { useState, useEffect, useCallback } from "react";
import Header from "../../components/layout/Header.jsx";
import ProtectedRoute from "../../components/common/ProtectedRoute.jsx";
import {
  Bell,
  Check,
  Trash2,
  Video,
  User as UserIcon,
  Heart,
  MessageSquare,
  Plus,
} from "lucide-react";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../../services/notificationService.js";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import { EmptyNotifications } from "../../components/common/EmptyState.jsx";
import toast from "react-hot-toast";

function NotificationsContent() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, hasNextPage: false });

  const fetchNotifications = useCallback(async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      const response = await getNotifications({ page: pageNum, limit: 15 });

      if (response.data.success) {
        const docs = response.data.data.notifications || [];
        const meta = response.data.data.pagination || {};

        if (pageNum === 1) {
          setNotifications(docs);
        } else {
          setNotifications((prev) => [...prev, ...docs]);
        }

        setPagination({
          page: pageNum,
          hasNextPage: meta.hasNextPage || false,
        });
      }
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      if (pageNum === 1) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Clear all notifications?")) return;
    try {
      await deleteAllNotifications();
      setNotifications([]);
      toast.success("All notifications cleared");
    } catch (error) {
      toast.error("Failed to clear notifications");
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "like":
        return <Heart className="h-5 w-5 text-red-500" />;
      case "comment":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "subscription":
        return <Plus className="h-5 w-5 text-primary" />;
      case "video_upload":
        return <Video className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-zinc-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-white">
      <Header />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            Notifications
          </h1>

          {notifications.length > 0 && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                Mark all read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteAll}
                className="text-red-400 hover:text-red-300"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-24 w-full animate-pulse bg-surface rounded-xl border border-border"
              ></div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyNotifications />
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`group flex items-start gap-4 p-4 rounded-xl border transition-all ${
                  notification.isRead
                    ? "bg-transparent border-border/50"
                    : "bg-surface border-primary/30 shadow-sm shadow-primary/5"
                }`}
              >
                <div
                  className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    notification.isRead ? "bg-zinc-800" : "bg-primary/10"
                  }`}
                >
                  {getIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3
                      className={`font-semibold truncate ${
                        notification.isRead ? "text-zinc-400" : "text-white"
                      }`}
                    >
                      {notification.title}
                    </h3>
                    <span className="text-xs text-zinc-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  <p
                    className={`text-sm mb-3 ${
                      notification.isRead ? "text-zinc-500" : "text-zinc-300"
                    }`}
                  >
                    {notification.message}
                  </p>

                  <div className="flex items-center gap-4">
                    {notification.relatedVideo && (
                      <Link
                        to={`/video/${
                          notification.relatedVideo._id ||
                          notification.relatedVideo
                        }`}
                        className="text-primary text-xs font-medium hover:underline flex items-center gap-1"
                      >
                        View Video
                      </Link>
                    )}
                    {notification.relatedUser && (
                      <Link
                        to={`/channel/${
                          notification.relatedUser.username ||
                          notification.relatedUser
                        }`}
                        className="text-primary text-xs font-medium hover:underline flex items-center gap-1"
                      >
                        View Profile
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification._id)}
                    className="p-1.5 hover:bg-zinc-800 rounded-md text-red-500/70 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {pagination.hasNextPage && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => fetchNotifications(pagination.page + 1)}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  );
}
